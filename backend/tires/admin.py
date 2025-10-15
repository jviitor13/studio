"""
Admin configuration for Tires
"""

from django.contrib import admin
from .models import Tire


@admin.register(Tire)
class TireAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'brand', 'model', 'status', 'vehicle', 'created_at']
    list_filter = ['status', 'brand', 'created_at']
    search_fields = ['serial_number', 'brand', 'model']
    readonly_fields = ['created_at', 'updated_at']