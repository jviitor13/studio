from rest_framework import serializers
from .models import UserProfile
from authentication.serializers import UserSerializer


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'phone', 'address', 'company', 'position',
            'emergency_contact', 'emergency_phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user profiles."""
    
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'address', 'company', 'position',
            'emergency_contact', 'emergency_phone'
        ]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)