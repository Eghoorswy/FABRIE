import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderDetail } from "./useOrderDetail";
import { Order, OrderStatus } from "@/types/order";
import OrderDetailView from "./OrderDetailView";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ensureCSRFToken } from "@/lib/axios";

const OrderDetail: React.FC = () => {
  const { order: initialOrder, loading, error: fetchError, updateOrder } = useOrderDetail();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Deep copy initial order to avoid reference issues
  useEffect(() => {
    if (initialOrder) {
      setOrder(JSON.parse(JSON.stringify(initialOrder)));
    }
  }, [initialOrder]);

  const handleSave = async () => {
    if (!order) {
      toast.error("No order data to save");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Ensure CSRF token is available
      await ensureCSRFToken();

      // Validate required fields
      if (!order.customer_name?.trim()) {
        toast.error("Customer name is required");
        return;
      }
      if (!order.product_name?.trim()) {
        toast.error("Product name is required");
        return;
      }
      if (!order.order_date) {
        toast.error("Order date is required");
        return;
      }
      if (!order.delivery_date) {
        toast.error("Delivery date is required");
        return;
      }

      // Create FormData with proper structure (individual fields, not nested JSON)
      const formData = new FormData();
      
      // Append all fields individually as the backend expects
      formData.append("customer_name", order.customer_name);
      formData.append("product_name", order.product_name);
      
      if (order.product_image instanceof File) {
        formData.append("product_image", order.product_image);
      } else if (order.product_image && typeof order.product_image === 'string') {
        // If it's a string (existing image URL), we might not need to send it
        // But if the backend expects the field, we can send it as is
        // formData.append("product_image", order.product_image);
      }
      
      formData.append("fabric_type", order.fabric_type || "");
      formData.append("fabric_weight", order.fabric_weight || "");
      
      // Append colours as individual entries
      (order.colours || []).forEach(color => {
        formData.append("colours", color);
      });
      
      formData.append("order_date", order.order_date);
      formData.append("delivery_date", order.delivery_date);
      formData.append("status", order.status);
      
      // Append sizes as individual entries
      (order.size || []).forEach(size => {
        formData.append("size", size);
      });
      
      formData.append("size_quantities", JSON.stringify(order.size_quantities || {}));
      formData.append("description", order.description || "");
      formData.append("is_set", order.is_set.toString());
      formData.append("set_multiplier", order.set_multiplier.toString());

      console.log("FormData contents for update:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await updateOrder(formData);
      setIsEditing(false);
      toast.success("Order updated successfully");
    } catch (error: any) {
      console.error("Error saving order:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to update order";
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialOrder) {
      setOrder(JSON.parse(JSON.stringify(initialOrder))); // Deep copy to reset
    }
    setIsEditing(false);
    setSaveError(null);
    toast.info("Changes discarded");
  };

  const handleChange = (field: keyof Order, value: any) => {
    if (!order) return;
    
    // Handle date fields
    if ((field === 'order_date' || field === 'delivery_date') && value) {
      setOrder({ 
        ...order, 
        [field]: value 
      });
      return;
    }

    // Handle file uploads
    if (field === 'product_image' && value instanceof File) {
      setOrder({ ...order, [field]: value });
      return;
    }

    setOrder({ ...order, [field]: value });
  };

  const handleSizeQuantityChange = (size: string, quantity: number) => {
    if (!order) return;

    const newSizeQuantities = {
      ...order.size_quantities,
      [size]: Math.max(0, quantity), // Ensure non-negative
    };

    // Calculate total quantity
    const newTotalQuantity = Object.values(newSizeQuantities).reduce<number>(
      (sum, qty) => sum + (Number(qty) || 0),
      0
    );

    setOrder({
      ...order,
      size_quantities: newSizeQuantities,
      quantity: newTotalQuantity,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Error state - no order found
  if (fetchError || (!order && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <Alert variant="destructive">
            <AlertDescription>{fetchError || "The order you're looking for doesn't exist."}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null; // Should not reach here due to above conditions
  }

  return (
    <OrderDetailView
      order={order}
      isEditing={isEditing}
      isSaving={isSaving}
      error={saveError}
      onBack={() => navigate("/orders")}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      onChange={handleChange}
      onSizeQuantityChange={handleSizeQuantityChange}
    />
  );
};

export default OrderDetail;