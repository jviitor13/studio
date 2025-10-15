"""
URL configuration for rodocheck_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from oauth2_provider import urls as oauth2_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('o/', include(oauth2_urls)),  # OAuth2 Provider URLs
    path('api/auth/', include('authentication.urls')),
    path('api/checklists/', include('checklists.urls')),
    path('api/vehicles/', include('vehicles.urls')),
    path('api/users/', include('users.urls')),
    path('api/tires/', include('tires.urls')),
    path('api/ai/', include('ai_assistant.urls')),
    path('accounts/', include('allauth.urls')),
    # Rota raiz simples para evitar 404 na home
    path('', lambda request: JsonResponse({
        "name": "RodoCheck API",
        "status": "ok",
        "endpoints": [
            "/o/",  # OAuth2 endpoints
            "/api/auth/",
            "/api/checklists/",
            "/api/vehicles/",
            "/api/users/",
            "/api/tires/",
            "/api/ai/"
        ]
    })),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
