import uuid
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from pgvector.django import VectorField

class Conversation(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_ENDED = 'ended'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ENDED, 'Ended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField(blank=True)
    participants = ArrayField(models.CharField(max_length=100), default=list)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    start_ts = models.DateTimeField(auto_now_add=True)
    end_ts = models.DateTimeField(null=True, blank=True)
    summary = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    embedding = VectorField(dimensions=1536, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['start_ts', 'status']),
            models.Index(fields=['created_by', 'status']),
        ]
        ordering = ['-start_ts']
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    @property
    def duration(self):
        if self.end_ts and self.start_ts:
            return self.end_ts - self.start_ts
        return None

class Message(models.Model):
    SENDER_USER = 'user'
    SENDER_AI = 'ai'
    SENDER_SYSTEM = 'system'
    SENDER_CHOICES = [
        (SENDER_USER, 'User'),
        (SENDER_AI, 'AI'),
        (SENDER_SYSTEM, 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    tokens = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    embedding = VectorField(dimensions=1536, blank=True, null=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
        ]
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."

class AnalysisJob(models.Model):
    JOB_SUMMARY = 'summary'
    JOB_SENTIMENT = 'sentiment'
    JOB_KEYPOINTS = 'keypoints'
    JOB_EMBEDDING = 'embedding'
    JOB_CHOICES = [
        (JOB_SUMMARY, 'Summary'),
        (JOB_SENTIMENT, 'Sentiment'),
        (JOB_KEYPOINTS, 'Key Points'),
        (JOB_EMBEDDING, 'Embedding'),
    ]
    
    STATUS_PENDING = 'pending'
    STATUS_RUNNING = 'running'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_RUNNING, 'Running'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    job_type = models.CharField(max_length=20, choices=JOB_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    result = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['conversation', 'job_type']),
            models.Index(fields=['status', 'created_at']),
        ]