from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom user model with Google OAuth integration."""
    google_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('admin', 'Administrador'),
            ('manager', 'Gerente'),
            ('mechanic', 'Mecânico'),
            ('driver', 'Motorista'),
        ],
        default='driver'
    )
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate user data."""
        super().clean()
        if self.google_id and len(self.google_id) > 100:
            raise ValidationError({'google_id': 'Google ID deve ter no máximo 100 caracteres.'})
        
        if self.role not in ['admin', 'manager', 'mechanic', 'driver']:
            raise ValidationError({'role': 'Role deve ser admin, manager, mechanic ou driver.'})

    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else self.email
