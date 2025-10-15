from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfileCreateSerializer
import logging

logger = logging.getLogger('rodocheck')


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileSerializer
        return UserProfileCreateSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_profile(request):
    """Create user profile if it doesn't exist."""
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if created:
            serializer = UserProfileCreateSerializer(profile, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {'message': 'Profile already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        return Response(
            {'error': 'Erro interno do servidor'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )