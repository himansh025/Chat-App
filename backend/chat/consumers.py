import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Conversation, Message
from ai_module.services import AIService

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.conversation_id = None
        self.user = None
        self.ai_service = AIService()

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope['user']
        
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Verify user has access to conversation
        if not await self.verify_conversation_access():
            await self.close()
            return

        await self.channel_layer.group_add(
            self.conversation_id,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if self.conversation_id:
            await self.channel_layer.group_discard(
                self.conversation_id,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'user_message':
            await self.handle_user_message(data)
        elif message_type == 'typing_indicator':
            await self.handle_typing_indicator(data)

    async def handle_user_message(self, data):
        content = data.get('content', '').strip()
        temp_id = data.get('temp_id', str(uuid.uuid4()))
        
        if not content:
            return

        # Save user message
        user_message = await self.save_message(
            sender=Message.SENDER_USER,
            content=content,
            metadata=data.get('metadata', {})
        )

        # Send acknowledgment
        await self.send(text_data=json.dumps({
            'type': 'message_ack',
            'temp_id': temp_id,
            'message_id': str(user_message.id),
            'timestamp': user_message.timestamp.isoformat()
        }))

        # Stream AI response
        await self.stream_ai_response(user_message)

    async def stream_ai_response(self, user_message):
        conversation = await self.get_conversation()
        messages = await self.get_conversation_messages()
        
        # Convert to AI service format
        ai_messages = [
            {
                'role': 'user' if msg.sender == Message.SENDER_USER else 'assistant',
                'content': msg.content
            }
            for msg in messages
        ]
        
        # Stream response
        full_response = ""
        async for token in self.ai_service.stream_chat_completion(ai_messages):
            full_response += token
            await self.send(text_data=json.dumps({
                'type': 'llm_token',
                'token': token,
                'done': False
            }))
        
        # Save AI message
        ai_message = await self.save_message(
            sender=Message.SENDER_AI,
            content=full_response,
            tokens=len(full_response.split())  # Rough estimate
        )
        
        await self.send(text_data=json.dumps({
            'type': 'llm_done',
            'message_id': str(ai_message.id),
            'text': full_response
        }))

    async def handle_typing_indicator(self, data):
        is_typing = data.get('is_typing', False)
        await self.channel_layer.group_send(
            self.conversation_id,
            {
                'type': 'typing_indicator',
                'user_id': str(self.user.id),
                'is_typing': is_typing
            }
        )

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    @database_sync_to_async
    def verify_conversation_access(self):
        try:
            conversation = Conversation.objects.get(
                id=self.conversation_id,
                created_by=self.user
            )
            return conversation.status == Conversation.STATUS_ACTIVE
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def get_conversation(self):
        return Conversation.objects.get(id=self.conversation_id)

    @database_sync_to_async
    def get_conversation_messages(self):
        return list(Message.objects.filter(conversation_id=self.conversation_id).order_by('timestamp'))

    @database_sync_to_async
    def save_message(self, sender, content, metadata=None, tokens=None):
        return Message.objects.create(
            conversation_id=self.conversation_id,
            sender=sender,
            content=content,
            metadata=metadata or {},
            tokens=tokens
        )