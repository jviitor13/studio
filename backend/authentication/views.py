from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.contrib.auth import get_user_model
User = get_user_model()
from .serializers import UserSerializer, LoginSerializer, GoogleAuthSerializer
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
import logging

logger = logging.getLogger('rodocheck')


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Handle Google OAuth authentication."""
    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            serializer.validated_data['google_token'],
            requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID
        )

        # Domain restriction
        email = serializer.validated_data['email']
        allowed_domain = getattr(settings, 'GOOGLE_ALLOWED_DOMAIN', None)
        if allowed_domain and not email.lower().endswith(f"@{allowed_domain.lower()}"):
            return Response({'error': 'Domínio de email não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        # Check if user exists
        google_id = idinfo['sub']
        
        try:
            user = User.objects.get(google_id=google_id)
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create(
                google_id=google_id,
                email=email,
                username=email,
                first_name=serializer.validated_data['first_name'],
                last_name=serializer.validated_data['last_name'],
                profile_picture=serializer.validated_data.get('profile_picture'),
                is_verified=True
            )

        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.error(f"Google auth error: {e}")
        return Response(
            {'error': 'Token do Google inválido.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in Google auth: {e}")
        return Response(
            {'error': 'Erro interno do servidor.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Handle traditional email/password login."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Handle user logout."""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Logout realizado com sucesso.'})
    except:
        return Response({'message': 'Logout realizado com sucesso.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """Get current user information."""
    return Response(UserSerializer(request.user).data)
