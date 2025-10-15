"""
URLs for AI Assistant functionality
"""

from django.urls import path
from . import views

urlpatterns = [
    # AI Assistant Chat
    path('chat/', views.ai_assistant_chat, name='ai_assistant_chat'),
    path('sessions/', views.AIAssistantSessionView.as_view(), name='ai_sessions'),
    path('sessions/<str:session_id>/messages/', views.AIAssistantMessageView.as_view(), name='ai_messages'),
    
    # Vehicle Damage Assessment
    path('assess-damage/', views.assess_vehicle_damage, name='assess_vehicle_damage'),
    path('damage-assessments/', views.VehicleDamageAssessmentView.as_view(), name='damage_assessments'),
    
    # Tire Analysis
    path('tire-analysis/', views.TireAnalysisView.as_view(), name='tire_analysis'),
    
    # AI Usage and Configuration
    path('usage-logs/', views.AIUsageLogView.as_view(), name='ai_usage_logs'),
    path('configurations/', views.AIConfigurationView.as_view(), name='ai_configurations'),
    path('status/', views.ai_service_status, name='ai_service_status'),
    path('usage-stats/', views.ai_usage_stats, name='ai_usage_stats'),
]

