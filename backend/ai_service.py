# ai_service.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator
import openai

class AIService(ABC):
    @abstractmethod
    async def stream_chat_completion(self, messages: list, **kwargs) -> AsyncGenerator[str, None]:
        pass
    
    @abstractmethod
    async def generate_embeddings(self, text: str) -> list[float]:
        pass

class OpenAIService(AIService):
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)
    
    async def stream_chat_completion(self, messages: list, **kwargs) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=kwargs.get('model', 'gpt-4'),
            messages=messages,
            stream=True,
            temperature=kwargs.get('temperature', 0.7)
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

class LocalLMService(AIService):
    async def stream_chat_completion(self, messages: list, **kwargs) -> AsyncGenerator[str, None]:
        # Implementation for local LM Studio or Ollama
        # Make HTTP requests to local endpoint
        pass