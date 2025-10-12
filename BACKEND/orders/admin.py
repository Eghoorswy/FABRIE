from django.contrib import admin
from orders.models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'product_id',
        'customer_name',
        'product_name',
        'fabric_type',
        'fabric_weight',
        'status',
        'order_date',
        'delivery_date'
    )
    search_fields = ('product_id', 'customer_name', 'product_name')
    list_filter = ('status', 'fabric_type', 'order_date', 'delivery_date')
    fieldsets = (
        (None, {
            'fields': (
                'customer_name', 'product_name', 'product_image',
                'fabric_type', 'fabric_weight', 'colours',
                'size', 'size_quantities', 'order_date',
                'delivery_date', 'status', 'quantity'
            )
        }),
    )