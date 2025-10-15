"""
Tire models for RodoCheck
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Tire(models.Model):
    """Tire model."""
    TIRE_STATUS = [
        ('new', 'Novo'),
        ('in_use', 'Em Uso'),
        ('in_stock', 'Em Estoque'),
        ('maintenance', 'Em Manutenção'),
        ('scrapped', 'Sucateado'),
    ]

    TIRE_POSITION = [
        ('front_left', 'Dianteiro Esquerdo'),
        ('front_right', 'Dianteiro Direito'),
        ('rear_left', 'Traseiro Esquerdo'),
        ('rear_right', 'Traseiro Direito'),
        ('spare', 'Estepe'),
    ]

    serial_number = models.CharField(max_length=100, unique=True)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    size = models.CharField(max_length=50)  # e.g., "295/80R22.5"
    status = models.CharField(max_length=20, choices=TIRE_STATUS, default='new')
    position = models.CharField(max_length=20, choices=TIRE_POSITION, blank=True)
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.SET_NULL, null=True, blank=True, related_name='tires')
    purchase_date = models.DateField(null=True, blank=True)
    installation_date = models.DateField(null=True, blank=True)
    tread_depth = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(20.0)],
        null=True, blank=True
    )
    mileage = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tires')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['serial_number']

    def __str__(self):
        return f"{self.brand} {self.model} - {self.serial_number}"

    @property
    def full_name(self):
        return f"{self.brand} {self.model} ({self.serial_number})"