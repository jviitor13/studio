from django.db import models
from django.contrib.auth import get_user_model
from vehicles.models import Vehicle

User = get_user_model()


class ChecklistTemplate(models.Model):
    """Template for checklist items."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    items = models.JSONField(default=list)  # List of checklist items
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class CompletedChecklist(models.Model):
    """Completed checklist instance."""
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('approved', 'Aprovado'),
        ('rejected', 'Rejeitado'),
    ]

    id = models.CharField(max_length=100, primary_key=True)  # Custom ID
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='checklists')
    template = models.ForeignKey(ChecklistTemplate, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_checklists')
    created_at = models.DateTimeField(auto_now_add=True)
    final_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    general_observations = models.TextField(blank=True)
    
    # Checklist data
    questions = models.JSONField(default=list)
    vehicle_images = models.JSONField(default=dict)
    signatures = models.JSONField(default=dict)
    
    # File storage
    pdf_file = models.FileField(upload_to='checklists/pdfs/', blank=True, null=True)
    is_pdf_generated = models.BooleanField(default=False)
    download_count = models.PositiveIntegerField(default=0)
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Checklist {self.id} - {self.vehicle}"


class ChecklistItem(models.Model):
    """Individual checklist item."""
    checklist = models.ForeignKey(CompletedChecklist, on_delete=models.CASCADE, related_name='checklist_items')
    text = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=[
        ('approved', 'Aprovado'),
        ('rejected', 'Rejeitado'),
        ('pending', 'Pendente'),
    ])
    observations = models.TextField(blank=True)
    photo = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.checklist.id} - {self.text[:50]}"
