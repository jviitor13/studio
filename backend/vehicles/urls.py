from django.urls import path
from . import views

urlpatterns = [
    path('', views.VehicleListCreateView.as_view(), name='vehicle-list'),
    path('<int:pk>/', views.VehicleDetailView.as_view(), name='vehicle-detail'),
]
