from rest_framework import serializers
from .models import ChecklistTemplate, CompletedChecklist, ChecklistItem
from vehicles.serializers import VehicleSerializer
from authentication.serializers import UserSerializer


class ChecklistItemSerializer(serializers.ModelSerializer):
    """Serializer for checklist items."""
    
    class Meta:
        model = ChecklistItem
        fields = ['text', 'status', 'observations', 'photo', 'order']


class ChecklistTemplateSerializer(serializers.ModelSerializer):
    """Serializer for checklist templates."""
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ChecklistTemplate
        fields = [
            'id', 'name', 'description', 'items', 'is_active',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompletedChecklistSerializer(serializers.ModelSerializer):
    """Serializer for completed checklists."""
    vehicle = VehicleSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = CompletedChecklist
        fields = [
            'id', 'vehicle', 'template', 'created_by', 'created_at',
            'final_status', 'general_observations', 'questions',
            'vehicle_images', 'signatures', 'pdf_file', 'is_pdf_generated',
            'download_count', 'checklist_items', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChecklistCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new checklists."""
    
    class Meta:
        model = CompletedChecklist
        fields = [
            'id', 'vehicle', 'template', 'final_status',
            'general_observations', 'questions', 'vehicle_images', 'signatures'
        ]

    def create(self, validated_data):
        # Set the user from the request
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
