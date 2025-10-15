"""
URLs for Tires
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.TireListCreateView.as_view(), name='tire_list_create'),
    path('<int:pk>/', views.TireDetailView.as_view(), name='tire_detail'),
    path('stats/', views.tire_stats, name='tire_stats'),
]

