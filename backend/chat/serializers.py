from rest_framework import serializers
from .models import Conversation, Message, AnalysisJob

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'tokens', 'metadata']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    duration = serializers.DurationField(read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'participants', 'status', 'start_ts', 'end_ts',
            'summary', 'metadata', 'duration', 'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'start_ts', 'created_at', 'updated_at']

class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    duration = serializers.DurationField(read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'status', 'start_ts', 'end_ts', 'summary',
            'message_count', 'last_message', 'duration', 'participants'
        ]
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'sender': last_msg.sender,
                'timestamp': last_msg.timestamp
            }
        return None

class AnalysisJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisJob
        fields = '__all__'