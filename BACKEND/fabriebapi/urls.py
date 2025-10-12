from django.contrib import admin
from django.urls import path, include
from .views import home_view  # import your home view
from orders.views import get_csrf_token
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', home_view),  # now '/' goes to the welcome page
    path('admin/', admin.site.urls),
    path('api/orders/', include('orders.urls')),
    path('api/finance/', include('finance.urls')),

    # Use only one CSRF endpoint - removed duplicate
    path("api/csrf/", get_csrf_token)
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)