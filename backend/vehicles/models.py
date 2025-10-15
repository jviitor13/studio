from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator

User = get_user_model()


class Vehicle(models.Model):
    """Vehicle model."""
    VEHICLE_TYPE_CHOICES = [
        ('truck', 'Caminhão'),
        ('trailer', 'Carreta'),
        ('bus', 'Ônibus'),
        ('van', 'Van'),
    ]

    plate = models.CharField(
        max_length=20, 
        unique=True,
        validators=[RegexValidator(
            regex=r'^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$',
            message='Placa deve estar no formato ABC1234 ou ABC1D23'
        )]
    )
    model = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    year = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1900, message='Ano deve ser maior que 1900'),
            MaxValueValidator(2030, message='Ano deve ser menor que 2030')
        ]
    )
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    color = models.CharField(max_length=50, blank=True)
    chassis_number = models.CharField(max_length=100, blank=True)
    owner = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_vehicles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['plate']

    def __str__(self):
        return f"{self.brand} {self.model} - {self.plate}"

    def clean(self):
        """Validate vehicle data."""
        super().clean()
        if self.year < 1900 or self.year > 2030:
            raise ValidationError({'year': 'Ano deve estar entre 1900 e 2030.'})
        
        if self.vehicle_type not in ['truck', 'trailer', 'bus', 'van']:
            raise ValidationError({'vehicle_type': 'Tipo de veículo inválido.'})

    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.brand} {self.model} ({self.plate})"
