import json
from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    # Extra fields
    is_set = serializers.BooleanField(required=False, default=False)
    set_multiplier = serializers.IntegerField(required=False, default=1, min_value=1)

    # Existing fields with custom handling
    size = serializers.ListField(
        child=serializers.ChoiceField(choices=Order.SIZE_CHOICES),
        allow_empty=True,
        required=False,
        default=list
    )
    
    size_quantities = serializers.DictField(
        child=serializers.IntegerField(allow_null=True, required=False),
        allow_empty=True,
        required=False,
        default=dict
    )
    
    colours = serializers.ListField(
        child=serializers.CharField(max_length=50),
        allow_empty=True,
        required=False,
        default=list
    )
    
    product_image = serializers.ImageField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['product_id']

    def validate_size_quantities(self, value):
        """Ensure size_quantities keys are valid sizes"""
        if value:
            valid_sizes = [size[0] for size in Order.SIZE_CHOICES]
            for size in value.keys():
                if size not in valid_sizes:
                    raise serializers.ValidationError(f"Invalid size: {size}")
        return value

    def to_internal_value(self, data):
        # Handle size_quantities JSON string
        if 'size_quantities' in data and isinstance(data['size_quantities'], str):
            try:
                data['size_quantities'] = json.loads(data['size_quantities'])
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    'size_quantities': 'Invalid JSON format'
                })
        
        # Handle colours as comma-separated string
        if 'colours' in data and isinstance(data['colours'], str):
            if ',' in data['colours']:
                data['colours'] = [color.strip() for color in data['colours'].split(',') if color.strip()]
            else:
                data['colours'] = [data['colours']] if data['colours'] else []
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        # Ensure quantity is calculated correctly
        size_quantities = validated_data.get('size_quantities', {})
        if size_quantities:
            validated_data['quantity'] = sum(qty or 0 for qty in size_quantities.values())
        
        return super().create(validated_data)