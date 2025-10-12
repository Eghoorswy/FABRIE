from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator


class Category(models.Model):
    CATEGORY_TYPES = [
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
    ]

    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)

    def __str__(self):
        return f"{self.name} ({self.type})"


class Transaction(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))]
    )
    date = models.DateField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.date} - {self.category.name}: {self.amount}"

    class Meta:
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["category"]),
        ]
        ordering = ("-date", "id")