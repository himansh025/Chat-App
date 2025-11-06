from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer
from .tasks import analyze_conversation

class ConversationFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    date_from = filters.DateFilter(field_name='start_ts', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='start_ts', lookup_expr='lte')
    status = filters.ChoiceFilter(choices=Conversation.STATUS_CHOICES)
    
    class Meta:
        model = Conversation
        fields = ['status', 'date_from', 'date_to']
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(summary__icontains=value) |
            Q(messages__content__icontains=value)
        ).distinct()

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.none()
    serializer_class = ConversationSerializer
    filterset_class = ConversationFilter
    
    def get_queryset(self):
        return Message.objects.filter(
            conversation__created_by=self.request.user
        ).select_related('conversation')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        conversation = self.get_object()
        if conversation.status == Conversation.STATUS_ACTIVE:
            conversation.status = Conversation.STATUS_ENDED
            conversation.save()
            
            # Trigger analysis tasks
            analyze_conversation.delay(str(conversation.id))
            
            return Response({'status': 'conversation ended'})
        return Response(
            {'error': 'Conversation already ended'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def query(self, request, pk=None):
        conversation = self.get_object()
        user_query = request.data.get('query')
        
        if not user_query:
            return Response(
                {'error': 'Query is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # This would integrate with the AI module for conversation-specific queries
        from ai_module.services import ConversationQueryService
        
        try:
            result = ConversationQueryService().query_conversation(conversation, user_query)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        return Message.objects.filter(
            conversation__created_by=self.request.user
        ).select_related('conversation')