from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import (
    VehicleViewSet,
    FuelEntryViewSet,
    dashboard_statistics,
    brand_statistics,
    grade_statistics
)

# Роутер для автоматического создания URL для ViewSets
# trailing_slash=False для совместимости с фронтендом (REST API стандарт)
router = DefaultRouter(trailing_slash=False)
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'fuel-entries', FuelEntryViewSet, basename='fuelentry')

urlpatterns = [
    path('auth/', include('users.urls')),
    path('users/', include('users.urls')),  # Для /api/v1/users/me
    # Statistics
    path('statistics/dashboard', dashboard_statistics, name='dashboard-statistics'),
    path('statistics/by-brand', brand_statistics, name='brand-statistics'),
    path('statistics/by-grade', grade_statistics, name='grade-statistics'),
    # OpenAPI Schema
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # API endpoints (vehicles, fuel-entries)
    path('', include(router.urls)),
]
