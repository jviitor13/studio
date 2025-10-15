from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for Vehicle model."""
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'plate', 'model', 'brand', 'year', 'vehicle_type',
            'color', 'chassis_number', 'owner', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
