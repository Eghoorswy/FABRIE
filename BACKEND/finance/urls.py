# finance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from finance.views import CategoryViewSet, TransactionViewSet, finance_report
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.authtoken import views

router = DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"transactions", TransactionViewSet)

# Removed duplicate CSRF function - using project-level one

urlpatterns = [
    path("report/", finance_report, name="finance-report"),
    # Removed duplicate CSRF endpoint
    path("api-token-auth/", views.obtain_auth_token),  # Add token authentication
    path("", include(router.urls)),
]