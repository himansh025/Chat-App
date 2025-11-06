from celery import shared_task
from .models import Conversation, AnalysisJob
from ai_module.services import AnalysisService

@shared_task
def analyze_conversation(conversation_id):
    """Background task to analyze conversation after it ends"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        analysis_service = AnalysisService()
        
        # Run various analysis tasks
        summary = analysis_service.generate_summary(conversation)
        key_points = analysis_service.extract_key_points(conversation)
        sentiment = analysis_service.analyze_sentiment(conversation)
        embeddings = analysis_service.generate_embeddings(conversation)
        
        # Update conversation with results
        conversation.summary = summary
        conversation.metadata.update({
            'key_points': key_points,
            'sentiment': sentiment,
            'analysis_complete': True
        })
        conversation.embedding = embeddings.get('conversation_embedding')
        conversation.save()
        
        return {
            'conversation_id': str(conversation_id),
            'summary_generated': bool(summary),
            'key_points_count': len(key_points),
            'sentiment_score': sentiment.get('score')
        }
        
    except Exception as e:
        # Log error and create failed job record
        AnalysisJob.objects.create(
            conversation_id=conversation_id,
            job_type=AnalysisJob.JOB_SUMMARY,
            status=AnalysisJob.STATUS_FAILED,
            error_message=str(e)
        )
        raise e