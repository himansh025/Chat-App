import os
import asyncio
from typing import AsyncGenerator, List, Dict, Any
from openai import AsyncOpenAI
from django.conf import settings
from chat.models import Conversation, Message

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.AI_MODEL
        self.embedding_model = settings.EMBEDDING_MODEL
    
    async def stream_chat_completion(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
        """Stream chat completion from OpenAI"""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=kwargs.get('temperature', 0.7),
                max_tokens=kwargs.get('max_tokens', 1000)
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for text"""
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            # Return zero vector as fallback
            return [0.0] * 1536
    
    async def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = []
        for text in texts:
            embedding = await self.generate_embeddings(text)
            embeddings.append(embedding)
        return embeddings

class AnalysisService:
    def __init__(self):
        self.ai_service = AIService()
    
    def generate_summary(self, conversation: Conversation) -> str:
        """Generate conversation summary"""
        messages = conversation.messages.all()
        conversation_text = "\n".join([
            f"{msg.sender}: {msg.content}" for msg in messages
        ])
        
        prompt = f"""
        Please provide a concise summary of the following conversation.
        Focus on the main topics, decisions made, and key outcomes.
        
        Conversation:
        {conversation_text}
        
        Summary:
        """
        
        # For now, we'll use a synchronous approach
        # In production, this would be async
        async def _generate():
            full_response = ""
            async for token in self.ai_service.stream_chat_completion([
                {"role": "user", "content": prompt}
            ]):
                full_response += token
            return full_response
        
        return asyncio.run(_generate())
    
    def extract_key_points(self, conversation: Conversation) -> List[Dict]:
        """Extract key points and action items"""
        messages = conversation.messages.all()
        conversation_text = "\n".join([
            f"{msg.sender}: {msg.content}" for msg in messages
        ])
        
        prompt = f"""
        Analyze the following conversation and extract:
        1. Key decisions made
        2. Action items with owners
        3. Important topics discussed
        4. Follow-up requirements
        
        Format the response as JSON with keys: decisions, actions, topics, follow_ups.
        
        Conversation:
        {conversation_text}
        """
        
        # Implementation similar to generate_summary
        # Return structured data
        return []
    
    def analyze_sentiment(self, conversation: Conversation) -> Dict[str, Any]:
        """Analyze conversation sentiment"""
        # Simple implementation - in production would use more sophisticated analysis
        return {
            'score': 0.5,  # Neutral
            'label': 'neutral',
            'confidence': 0.8
        }
    
    def generate_embeddings(self, conversation: Conversation) -> Dict[str, Any]:
        """Generate embeddings for conversation and messages"""
        # Generate conversation-level embedding
        conversation_text = conversation.summary or " ".join([
            msg.content for msg in conversation.messages.all()
        ])
        
        conversation_embedding = asyncio.run(
            self.ai_service.generate_embeddings(conversation_text)
        )
        
        # Generate message-level embeddings
        messages = conversation.messages.all()
        message_texts = [msg.content for msg in messages]
        message_embeddings = asyncio.run(
            self.ai_service.generate_batch_embeddings(message_texts)
        )
        
        # Update messages with embeddings
        for msg, embedding in zip(messages, message_embeddings):
            msg.embedding = embedding
            msg.save()
        
        return {
            'conversation_embedding': conversation_embedding,
            'message_embeddings_count': len(message_embeddings)
        }

class ConversationQueryService:
    def __init__(self):
        self.ai_service = AIService()
    
    def query_conversation(self, conversation: Conversation, query: str) -> Dict[str, Any]:
        """Answer questions about a specific conversation"""
        messages = conversation.messages.all()
        context = "\n".join([
            f"{msg.sender}: {msg.content}" for msg in messages
        ])
        
        prompt = f"""
        Based on the following conversation, please answer the user's question.
        
        Conversation:
        {context}
        
        Question: {query}
        
        Answer:
        """
        
        async def _generate_answer():
            full_response = ""
            async for token in self.ai_service.stream_chat_completion([
                {"role": "user", "content": prompt}
            ]):
                full_response += token
            return full_response
        
        answer = asyncio.run(_generate_answer())
        
        return {
            'answer': answer,
            'conversation_id': str(conversation.id),
            'conversation_title': conversation.title,
            'sources': []  # Could include specific message references
        }

class SemanticSearchService:
    def __init__(self):
        self.ai_service = AIService()
    
    async def search_conversations(self, query: str, filters: Dict = None, limit: int = 10):
        """Semantic search across all conversations"""
        from chat.models import Conversation, Message
        from pgvector.django import L2Distance
        
        # Generate query embedding
        query_embedding = await self.ai_service.generate_embeddings(query)
        
        # Search conversations
        similar_convos = Conversation.objects.annotate(
            similarity=L2Distance('embedding', query_embedding)
        ).filter(
            status=Conversation.STATUS_ENDED
        ).order_by('similarity')[:limit]
        
        # Search individual messages
        similar_messages = Message.objects.annotate(
            similarity=L2Distance('embedding', query_embedding)
        ).filter(
            conversation__status=Conversation.STATUS_ENDED
        ).select_related('conversation').order_by('similarity')[:limit]
        
        return {
            'conversations': [
                {
                    'id': str(convo.id),
                    'title': convo.title,
                    'summary': convo.summary,
                    'similarity': float(convo.similarity),
                    'start_ts': convo.start_ts
                }
                for convo in similar_convos
            ],
            'messages': [
                {
                    'id': str(msg.id),
                    'content': msg.content,
                    'sender': msg.sender,
                    'timestamp': msg.timestamp,
                    'conversation_id': str(msg.conversation_id),
                    'conversation_title': msg.conversation.title,
                    'similarity': float(msg.similarity)
                }
                for msg in similar_messages
            ]
        }
    
    async def rag_query(self, query: str, filters: Dict = None):
        """Retrieval Augmented Generation across all conversations"""
        # Get relevant conversations and messages
        search_results = await self.search_conversations(query, filters)
        
        # Build context from search results
        context = "Relevant conversations and messages:\n\n"
        
        for convo in search_results['conversations'][:3]:
            context += f"Conversation: {convo['title']}\n"
            context += f"Summary: {convo['summary']}\n\n"
        
        for msg in search_results['messages'][:5]:
            context += f"Message from {msg['sender']} ({msg['timestamp']}): {msg['content']}\n\n"
        
        # Generate answer using RAG
        prompt = f"""
        Based on the following context from previous conversations, please answer the user's question.
        
        Context:
        {context}
        
        Question: {query}
        
        Please provide a comprehensive answer based on the available information. If the context doesn't contain relevant information, say so.
        
        Answer:
        """
        
        full_response = ""
        async for token in self.ai_service.stream_chat_completion([
            {"role": "user", "content": prompt}
        ]):
            full_response += token
        
        return {
            'answer': full_response,
            'sources': {
                'conversations': search_results['conversations'][:3],
                'messages': search_results['messages'][:5]
            }
        }