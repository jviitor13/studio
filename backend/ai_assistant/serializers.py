"""
Serializers for AI Assistant functionality
"""

from rest_framework import serializers
from .models import (
    AIAssistantSession, AIAssistantMessage, 
    VehicleDamageAssessment, TireAnalysis, AIConfiguration, AIUsageLog
)


class AIAssistantSessionSerializer(serializers.ModelSerializer):
    """Serializer for AI Assistant sessions."""
    class Meta:
        model = AIAssistantSession
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AIAssistantMessageSerializer(serializers.ModelSerializer):
    """Serializer for AI Assistant messages."""
    class Meta:
        model = AIAssistantMessage
        fields = ['id', 'message_type', 'content', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class VehicleDamageAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for vehicle damage assessments."""
    vehicle_plate = serializers.CharField(source='vehicle.plate', read_only=True)
    checklist_id = serializers.CharField(source='checklist.id', read_only=True)
    
    class Meta:
        model = VehicleDamageAssessment
        fields = [
            'id', 'checklist_id', 'vehicle_plate', 'image_url', 
            'damage_detected', 'damage_description', 'confidence_score',
            'status', 'ai_model_used', 'processing_time', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TireAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for tire analysis."""
    tire_serial = serializers.CharField(source='tire.serial_number', read_only=True)
    
    class Meta:
        model = TireAnalysis
        fields = [
            'id', 'tire_serial', 'image_url', 'wear_level', 'wear_percentage',
            'damage_detected', 'damage_description', 'recommendation',
            'confidence_score', 'status', 'ai_model_used', 'processing_time', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AIConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for AI configuration."""
    class Meta:
        model = AIConfiguration
        fields = ['id', 'service_name', 'model_name', 'is_active', 'configuration', 'created_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AIUsageLogSerializer(serializers.ModelSerializer):
    """Serializer for AI usage logs."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AIUsageLog
        fields = [
            'id', 'user_email', 'service_name', 'model_name', 
            'input_tokens', 'output_tokens', 'cost', 'processing_time',
            'success', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AIAssistantRequestSerializer(serializers.Serializer):
    """Serializer for AI assistant requests."""
    query = serializers.CharField(max_length=1000)
    session_id = serializers.CharField(max_length=100, required=False)
    context = serializers.JSONField(required=False, default=dict)


class VehicleDamageRequestSerializer(serializers.Serializer):
    """Serializer for vehicle damage assessment requests."""
    checklist_id = serializers.CharField(max_length=100)
    vehicle_id = serializers.CharField(max_length=100)
    image_url = serializers.URLField()
    image_base64 = serializers.CharField(required=False)


class TireAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for tire analysis requests."""
    tire_id = serializers.CharField(max_length=100)
    image_url = serializers.URLField()
    image_base64 = serializers.CharField(required=False)

