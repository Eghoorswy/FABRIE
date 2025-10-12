from django.urls import path
from orders.views import OrderListCreateView, OrderDetailView, get_csrf_token

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<str:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('csrf/', get_csrf_token, name='get-csrf'),
]