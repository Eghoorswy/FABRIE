import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Order, OrderStatus } from "@/types/order";
import { toast } from "sonner";
import api, { ensureCSRFToken } from '@/lib/axios';

const sizesList = ["S", "M", "L", "XL", "2XL", "3XL"];
const statusOptions: OrderStatus[] = ["Pending", "cutting", "stitching", "finishing", "Ready for Delivery", "Delivered", "Cancelled"];

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState("");

  // Set default dates
  const getDefaultOrderDate = () => new Date().toISOString().split('T')[0];
  const getDefaultDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const [order, setOrder] = useState<Omit<Order, "product_id" | "quantity">>({
    customer_name: "",
    product_name: "",
    product_image: null,
    order_date: getDefaultOrderDate(),
    delivery_date: getDefaultDeliveryDate(),
    status: "Pending",
    size: [],
    size_quantities: {},
    fabric_type: "",
    fabric_weight: "",
    colours: [],
    description: "",
    is_set: false,
    set_multiplier: 1,
  });

  // Ensure CSRF token is available on component mount
  useEffect(() => {
    ensureCSRFToken().catch(error => {
      console.warn("CSRF token fetch failed:", error);
    });
  }, []);

  const handleCheckboxChange = (size: string) => {
    setOrder(prev => {
      const prevSizes = prev.size ?? [];
      const updatedSizes = prevSizes.includes(size)
        ? prevSizes.filter(s => s !== size)
        : [...prevSizes, size];

      const updatedQuantities = { ...prev.size_quantities };
      if (!updatedSizes.includes(size)) {
        delete updatedQuantities[size];
      } else if (!(size in updatedQuantities)) {
        updatedQuantities[size] = 0;
      }

      return { ...prev, size: updatedSizes, size_quantities: updatedQuantities };
    });
  };

  const handleQuantityChange = (size: string, value: string) => {
    // Accept empty string or valid number string
    if (value === "" || /^\d+$/.test(value)) {
      setOrder(prev => ({
        ...prev,
        size_quantities: {
          ...prev.size_quantities,
          [size]: value === "" ? 0 : Number(value),
        },
      }));
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColorInput(val);

    const coloursArray = val.split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);
    setOrder(prev => ({ ...prev, colours: coloursArray }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setOrder(prev => ({ ...prev, product_image: file }));
  };

  const getTotalQuantity = () => {
    return Object.values(order.size_quantities ?? {})
      .reduce<number>((sum, q) => sum + (Number(q) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validation
      if (!order.customer_name.trim()) {
        throw new Error("Customer name is required");
      }
      if (!order.product_name.trim()) {
        throw new Error("Product name is required");
      }
      if ((order.size ?? []).length === 0) {
        throw new Error("Select at least one size");
      }
      
      const totalQty = getTotalQuantity();
      if (totalQty === 0) {
        throw new Error("Enter quantity for selected sizes");
      }
      
      if ((order.colours ?? []).length === 0) {
        throw new Error("Enter at least one color");
      }

      // Ensure CSRF token
      await ensureCSRFToken();

      // Prepare FormData
      const formData = new FormData();
      
      formData.append("customer_name", order.customer_name);
      formData.append("product_name", order.product_name);
      
      if (order.product_image instanceof File) {
        formData.append("product_image", order.product_image);
      }
      
      formData.append("fabric_type", order.fabric_type || "");
      formData.append("fabric_weight", order.fabric_weight || "");
      
      // Append colours as individual entries
      (order.colours ?? []).forEach(color => {
        formData.append("colours", color);
      });
      
      formData.append("order_date", order.order_date);
      formData.append("delivery_date", order.delivery_date);
      formData.append("status", order.status);
      
      // Append sizes as individual entries
      (order.size ?? []).forEach(size => {
        formData.append("size", size);
      });
      
      formData.append("size_quantities", JSON.stringify(order.size_quantities));
      formData.append("description", order.description || "");
      formData.append("is_set", order.is_set.toString());
      formData.append("set_multiplier", order.set_multiplier.toString());

      console.log("Creating order with FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // FIXED: Correct API endpoint
      const response = await api.post("/api/orders/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success("Order created successfully!");
      
      // Navigate to orders list
      navigate("/orders");
      
    } catch (error: any) {
      console.error("Failed to submit order:", error);
      
      let errorMessage = "Failed to create order. Please try again.";
      
      if (error.response?.data) {
        console.error("Server response:", error.response.data);
        if (typeof error.response.data === 'object') {
          // Handle Django validation errors
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors.join(', ') || errorMessage;
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-3xl font-bold mb-6">Create New Order</h1>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={order.customer_name}
                  onChange={e => setOrder({ ...order, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={order.product_name}
                  onChange={e => setOrder({ ...order, product_name: e.target.value })}
                  placeholder="Enter product name"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product_image">Product Image</Label>
              <Input
                id="product_image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1"
                disabled={isSubmitting}
              />
              {order.product_image instanceof File && (
                <p className="text-sm text-gray-600 mt-1">Selected: {order.product_image.name}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fabric_type">Fabric Type</Label>
                <Input
                  id="fabric_type"
                  value={order.fabric_type}
                  onChange={e => setOrder({ ...order, fabric_type: e.target.value })}
                  placeholder="e.g., Cotton, Polyester"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="fabric_weight">Fabric Weight</Label>
                <Input
                  id="fabric_weight"
                  value={order.fabric_weight}
                  onChange={e => setOrder({ ...order, fabric_weight: e.target.value })}
                  placeholder="e.g., 180 GSM"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="colors">Colors *</Label>
              <Input
                id="colors"
                value={colorInput}
                onChange={handleColorInputChange}
                placeholder="Enter colors separated by commas (e.g., Red, Blue, Green)"
                required
                disabled={isSubmitting}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {(order.colours ?? []).map((color, index) => (
                  <Badge key={index} variant="secondary">{color}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={order.description}
                onChange={e => setOrder({ ...order, description: e.target.value })}
                rows={3}
                placeholder="Additional product details or specifications"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Set Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Set Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_set"
                checked={order.is_set}
                onCheckedChange={checked => setOrder({ ...order, is_set: checked as boolean })}
                disabled={isSubmitting}
              />
              <Label htmlFor="is_set">This is a set (e.g., shirt + pants)</Label>
            </div>
            {order.is_set && (
              <div className="mt-4">
                <Label htmlFor="set_multiplier">Number of Items in Set</Label>
                <Input
                  id="set_multiplier"
                  type="number"
                  min={2}
                  value={order.set_multiplier}
                  onChange={e => setOrder({ ...order, set_multiplier: parseInt(e.target.value) || 2 })}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-600 mt-1">
                  The quantity for each size will be multiplied by this number
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sizes & Quantities */}
        <Card>
          <CardHeader>
            <CardTitle>Sizes & Quantities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sizesList.map(size => (
                <div key={size} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`size-${size}`} className="text-base">{size}</Label>
                    <Checkbox
                      id={`size-${size}`}
                      checked={(order.size ?? []).includes(size)}
                      onCheckedChange={() => handleCheckboxChange(size)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {(order.size ?? []).includes(size) && (
                    <Input
                      type="number"
                      min={0}
                      value={order.size_quantities?.[size] ?? 0}
                      onChange={e => handleQuantityChange(size, e.target.value)}
                      placeholder="Quantity"
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              ))}
            </div>

            <Separator className="my-4" />
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Total Quantity:</span>
              <span className="text-lg font-bold">{getTotalQuantity()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={order.order_date}
                  onChange={e => setOrder({ ...order, order_date: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={order.delivery_date}
                  onChange={e => setOrder({ ...order, delivery_date: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={order.status} 
                onValueChange={value => setOrder({ ...order, status: value as OrderStatus })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;