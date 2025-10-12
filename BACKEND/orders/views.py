# orders/views.py
import json
import logging
from rest_framework import generics, status
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import get_object_or_404
from django.utils import timezone
from orders.models import Order
from orders.serializers import OrderSerializer

logger = logging.getLogger(__name__)


def normalize_request_data(request_data):
    """
    Convert request data to a clean dict, handling both FormData and JSON.
    """
    data = {}
    
    # Handle FormData (MultiValueDict)
    if hasattr(request_data, 'getlist'):
        for key in request_data.keys():
            if key in ['size', 'colours']:
                # Handle arrays
                values = request_data.getlist(key)
                data[key] = [v for v in values if v.strip()] if values else []
            else:
                value = request_data.get(key)
                if value not in [None, '', 'null', 'undefined']:
                    data[key] = value
    else:
        # Handle JSON data
        data = request_data.dict().copy()
    
    # Ensure proper data types
    # Handle size_quantities
    raw_sq = data.get("size_quantities", {})
    if isinstance(raw_sq, str):
        try:
            raw_sq = json.loads(raw_sq)
        except (json.JSONDecodeError, TypeError):
            raw_sq = {}
    
    clean_sq = {}
    for k, v in (raw_sq or {}).items():
        try:
            if v in (None, "", "null", "undefined"):
                clean_sq[k] = None
            else:
                clean_sq[k] = int(v)
        except (TypeError, ValueError):
            clean_sq[k] = None
    
    data["size_quantities"] = clean_sq
    
    # Handle boolean fields
    is_set = data.get("is_set", False)
    if isinstance(is_set, str):
        data["is_set"] = is_set.lower() in ("true", "1", "yes", "on")
    else:
        data["is_set"] = bool(is_set)
    
    # Handle integer fields
    try:
        data["set_multiplier"] = int(data.get("set_multiplier", 1))
    except (TypeError, ValueError):
        data["set_multiplier"] = 1
    
    try:
        data["quantity"] = int(data.get("quantity", 0))
    except (TypeError, ValueError):
        data["quantity"] = 0
    
    # Ensure arrays are lists
    if "size" not in data or not isinstance(data["size"], list):
        data["size"] = []
    
    if "colours" not in data or not isinstance(data["colours"], list):
        data["colours"] = []
    
    # Filter out empty values from arrays
    data["size"] = [s for s in data["size"] if s and s.strip()]
    data["colours"] = [c for c in data["colours"] if c and c.strip()]
    
    return data


class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        logger.info(f"Incoming raw data for order creation: {dict(request.data)}")
        try:
            payload = normalize_request_data(request.data)
            logger.info(f"Normalized payload: {payload}")
            
            serializer = self.get_serializer(data=payload)
            serializer.is_valid(raise_exception=True)
            order = serializer.save()
            
            # Return the created order with correct quantity calculation
            response_data = OrderSerializer(order).data
            logger.info(f"Order created successfully: {order.product_id}")
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = "product_id"

    def get_object(self):
        product_id = self.kwargs["pk"]
        logger.info(f"Retrieving order with product_id: {product_id}")
        return get_object_or_404(Order, product_id=product_id)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        logger.info(f"Updating order: {instance.product_id}")
        payload = normalize_request_data(request.data)

        serializer = self.get_serializer(
            instance, data=payload, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Return updated order with correct calculations
        response_data = OrderSerializer(order).data
        logger.info(f"Order updated successfully: {order.product_id}")
        return Response(response_data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        logger.info(f"Deleting order: {instance.product_id}")
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


@ensure_csrf_cookie
def get_csrf_token(request):
    logger.info("CSRF token requested")
    return JsonResponse({"detail": "CSRF cookie set"})