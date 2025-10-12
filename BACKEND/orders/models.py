from django.db import models
from django.utils import timezone
import string
import random
import json
from django.contrib.postgres.fields import ArrayField


def generate_product_id():
    chars = string.ascii_uppercase + string.digits
    while True:
        new_id = ''.join(random.choices(chars, k=5))
        if not Order.objects.filter(product_id=new_id).exists():
            return new_id


class Order(models.Model):
    product_id = models.CharField(
        max_length=100,
        primary_key=True,
        default=generate_product_id,
        editable=False
    )
    customer_name = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255)
    product_image = models.ImageField(upload_to='products/', blank=True, null=True)

    fabric_type = models.CharField(max_length=100, blank=True, null=True)
    fabric_weight = models.CharField(max_length=50, blank=True, null=True)
    colours = ArrayField(models.CharField(max_length=50), blank=True, null=True, default=list)
    description = models.TextField(blank=True, null=True)

    SIZE_CHOICES = [
        ('S', 'Small'),
        ('M', 'Medium'),
        ('L', 'Large'),
        ('XL', 'Extra Large'),
        ('2XL', '2X Large'),
        ('3XL', '3X Large'),
    ]
    size = ArrayField(models.CharField(max_length=4, choices=SIZE_CHOICES), blank=True, default=list)
    size_quantities = models.JSONField(default=dict, blank=True)  # Store size quantities as a JSON field

    order_date = models.DateField(default=timezone.now)
    delivery_date = models.DateField(default=timezone.now)

    quantity = models.PositiveIntegerField(default=1)

    # Set-related fields
    is_set = models.BooleanField(default=False)
    set_multiplier = models.PositiveIntegerField(default=1)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('cutting', 'In Progress'),
        ('stitching', 'In Progress'),
        ('finishing', 'In Progress'),
        ('Ready for Delivery', 'Ready for Delivery'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return self.product_id

    def save(self, *args, **kwargs):
        # Ensure size_quantities is properly formatted
        if isinstance(self.size_quantities, str):
            try:
                self.size_quantities = json.loads(self.size_quantities)
            except json.JSONDecodeError:
                self.size_quantities = {}

        # Calculate total quantity from size-wise quantities
        if isinstance(self.size_quantities, dict):
            total_qty = sum(v for v in self.size_quantities.values() if v is not None)
            self.quantity = total_qty

        # Apply set multiplier if it's a set
        if self.is_set:
            self.quantity *= self.set_multiplier

        super().save(*args, **kwargs)