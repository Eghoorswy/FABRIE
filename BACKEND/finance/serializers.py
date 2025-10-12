from rest_framework import serializers
from finance.models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    category_type = serializers.ReadOnlyField(source="category.type")

    class Meta:
        model = Transaction
        fields = ["id", "category", "category_name", "category_type", "amount", "date", "description"]
        read_only_fields = ("id", "category_name", "category_type")