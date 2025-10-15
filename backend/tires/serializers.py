"""
Serializers for Tires
"""

from rest_framework import serializers
from .models import Tire


class TireSerializer(serializers.ModelSerializer):
    """Serializer for Tire model."""
    vehicle_plate = serializers.CharField(source='vehicle.plate', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Tire
        fields = [
            'id', 'serial_number', 'brand', 'model', 'size', 'status', 'position',
            'vehicle', 'vehicle_plate', 'purchase_date', 'installation_date',
            'tread_depth', 'mileage', 'price', 'is_active', 'created_by_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

