"""
Admin configuration for AI Assistant
"""

from django.contrib import admin
from .models import (
    AIAssistantSession, AIAssistantMessage, 
    VehicleDamageAssessment, TireAnalysis, 
    AIConfiguration, AIUsageLog
)


@admin.register(AIAssistantSession)
class AIAssistantSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['session_id', 'user__email']
    readonly_fields = ['session_id', 'created_at', 'updated_at']


@admin.register(AIAssistantMessage)
class AIAssistantMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'message_type', 'content_preview', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['content', 'session__session_id']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(VehicleDamageAssessment)
class VehicleDamageAssessmentAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'checklist', 'damage_detected', 'status', 'created_at']
    list_filter = ['damage_detected', 'status', 'created_at']
    search_fields = ['vehicle__plate', 'checklist__id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TireAnalysis)
class TireAnalysisAdmin(admin.ModelAdmin):
    list_display = ['tire', 'wear_level', 'damage_detected', 'status', 'created_at']
    list_filter = ['wear_level', 'damage_detected', 'status', 'created_at']
    search_fields = ['tire__serial_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AIConfiguration)
class AIConfigurationAdmin(admin.ModelAdmin):
    list_display = ['service_name', 'model_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['service_name', 'model_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'service_name', 'model_name', 'success', 'cost', 'created_at']
    list_filter = ['service_name', 'success', 'created_at']
    search_fields = ['user__email', 'service_name']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        return False  # Usage logs are created automatically