"""
Views for Tires
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models

from .models import Tire
from .serializers import TireSerializer


class TireListCreateView(generics.ListCreateAPIView):
    """View for listing and creating tires."""
    serializer_class = TireSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tire.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TireDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for tire details."""
    serializer_class = TireSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tire.objects.filter(created_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tire_stats(request):
    """Get tire statistics."""
    user_tires = Tire.objects.filter(created_by=request.user)
    
    stats = {
        'total_tires': user_tires.count(),
        'tires_by_status': {},
        'tires_by_brand': {},
        'average_mileage': 0,
        'tires_needing_attention': 0
    }
    
    # Count by status
    for status_choice in Tire.TIRE_STATUS:
        count = user_tires.filter(status=status_choice[0]).count()
        stats['tires_by_status'][status_choice[1]] = count
    
    # Count by brand
    for tire in user_tires:
        brand = tire.brand
        stats['tires_by_brand'][brand] = stats['tires_by_brand'].get(brand, 0) + 1
    
    # Average mileage
    if user_tires.exists():
        stats['average_mileage'] = sum(tire.mileage for tire in user_tires) / user_tires.count()
    
    # Tires needing attention (low tread depth or high mileage)
    stats['tires_needing_attention'] = user_tires.filter(
        models.Q(tread_depth__lt=3.0) | models.Q(mileage__gt=50000)
    ).count()
    
    return Response(stats, status=status.HTTP_200_OK)