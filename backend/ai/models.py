"""
AI-related models for RodoCheck
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class AIAssistantSession(models.Model):
    """Session for AI assistant interactions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Session {self.session_id} - {self.user.email}"


class AIAssistantMessage(models.Model):
    """Messages in AI assistant conversations."""
    MESSAGE_TYPES = [
        ('user', 'Usuário'),
        ('assistant', 'Assistente'),
        ('system', 'Sistema'),
    ]

    session = models.ForeignKey(AIAssistantSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.get_message_type_display()}: {self.content[:50]}..."


class VehicleDamageAssessment(models.Model):
    """AI-powered vehicle damage assessment."""
    ASSESSMENT_STATUS = [
        ('pending', 'Pendente'),
        ('processing', 'Processando'),
        ('completed', 'Concluído'),
        ('failed', 'Falhou'),
    ]

    checklist = models.ForeignKey('checklists.CompletedChecklist', on_delete=models.CASCADE, related_name='damage_assessments')
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.CASCADE, related_name='damage_assessments')
    image_url = models.URLField()
    image_base64 = models.TextField(blank=True)  # Store base64 for AI processing
    damage_detected = models.BooleanField(default=False)
    damage_description = models.TextField(blank=True)
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=ASSESSMENT_STATUS, default='pending')
    ai_model_used = models.CharField(max_length=100, blank=True)
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Damage Assessment for {self.vehicle.plate} - {self.get_status_display()}"


class TireAnalysis(models.Model):
    """AI-powered tire analysis."""
    ANALYSIS_STATUS = [
        ('pending', 'Pendente'),
        ('processing', 'Processando'),
        ('completed', 'Concluído'),
        ('failed', 'Falhou'),
    ]

    tire = models.ForeignKey('tires.Tire', on_delete=models.CASCADE, related_name='ai_analyses')
    image_url = models.URLField()
    image_base64 = models.TextField(blank=True)
    wear_level = models.CharField(max_length=50, blank=True)  # e.g., "Good", "Moderate", "Severe"
    wear_percentage = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        null=True, blank=True
    )
    damage_detected = models.BooleanField(default=False)
    damage_description = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=ANALYSIS_STATUS, default='pending')
    ai_model_used = models.CharField(max_length=100, blank=True)
    processing_time = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Tire Analysis for {self.tire.serial_number} - {self.get_status_display()}"


class AIConfiguration(models.Model):
    """Configuration for AI services."""
    service_name = models.CharField(max_length=100, unique=True)
    api_key = models.CharField(max_length=500, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    configuration = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service_name']

    def __str__(self):
        return f"AI Config: {self.service_name}"


class AIUsageLog(models.Model):
    """Log AI service usage for monitoring and billing."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_usage_logs')
    service_name = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    processing_time = models.FloatField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Usage: {self.service_name} - {self.user.email} - {self.created_at}"

