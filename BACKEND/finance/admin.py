from django.contrib import admin
from finance.models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'type']
    list_filter = ['type']
    search_fields = ['name']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'category', 'amount', 'description']
    list_filter = ['date', 'category']
    search_fields = ['description']
    date_hierarchy = 'date'
    autocomplete_fields = ['category']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('category')