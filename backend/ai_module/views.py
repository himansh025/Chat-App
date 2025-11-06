from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import SemanticSearchService

class AIQueryView(APIView):
    async def post(self, request):
        query = request.data.get('query')
        filters = request.data.get('filters', {})
        
        if not query:
            return Response(
                {'error': 'Query is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            search_service = SemanticSearchService()
            result = await search_service.rag_query(query, filters)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SemanticSearchView(APIView):
    async def post(self, request):
        query = request.data.get('query')
        filters = request.data.get('filters', {})
        limit = request.data.get('limit', 10)
        
        if not query:
            return Response(
                {'error': 'Query is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            search_service = SemanticSearchService()
            result = await search_service.search_conversations(query, filters, limit)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReindexView(APIView):
    def post(self, request):
        # This would trigger reindexing of all conversations
        # Implementation would depend on specific requirements
        return Response({'status': 'Reindexing started'})