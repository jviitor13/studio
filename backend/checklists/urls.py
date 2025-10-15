from django.urls import path
from . import views

urlpatterns = [
    # Templates
    path('templates/', views.ChecklistTemplateListCreateView.as_view(), name='template-list'),
    path('templates/<int:pk>/', views.ChecklistTemplateDetailView.as_view(), name='template-detail'),
    
    # Completed checklists
    path('', views.CompletedChecklistListCreateView.as_view(), name='checklist-list'),
    path('<str:pk>/', views.CompletedChecklistDetailView.as_view(), name='checklist-detail'),
    path('<str:checklist_id>/download/', views.download_checklist_pdf, name='checklist-download'),
    path('<str:checklist_id>/download-info/', views.checklist_download_info, name='checklist-download-info'),
]
