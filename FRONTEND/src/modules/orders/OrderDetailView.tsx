import React, { useRef, useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Printer,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderDetailViewProps {
  order: Order;
  isEditing: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onChange: (field: keyof Order, value: any) => void;
  onSizeQuantityChange: (size: string, quantity: number) => void;
}

const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  isEditing,
  isSaving = false,
  isDeleting = false,
  error = null,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onChange,
  onSizeQuantityChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid date";
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Ready for Delivery":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cutting":
      case "stitching":
      case "finishing":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select an image file (JPEG, PNG, GIF, etc.)";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image size should be less than 5MB";
    }
    return null;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `/api/orders/${order.product_id}/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      onChange("product_image", data.imageUrl);
      toast.success("Image uploaded successfully");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    onChange("product_image", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Image removed");
  };

  const getImageUrl = (): string | null => {
    if (!order.product_image) return null;
    if (typeof order.product_image === "string") {
      return order.product_image;
    }
    return URL.createObjectURL(order.product_image);
  };

  const handlePrintOrder = () => {
    try {
      const imageUrl = getImageUrl();
      const printContent = generatePrintContent(order, imageUrl);
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.info("Please allow popups for printing or use browser's print function");
        const fallbackPrintContent = document.createElement("div");
        fallbackPrintContent.innerHTML = printContent;
        document.body.appendChild(fallbackPrintContent);
        window.print();
        document.body.removeChild(fallbackPrintContent);
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 100);
        }, 500);
      };
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Failed to generate print preview");
    }
  };

  const generatePrintContent = (order: Order, imageUrl: string | null): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${order.product_id}</title>
        <style>
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #333;
            background: #fff;
            line-height: 1.4;
          }
          .print-container { 
            max-width: 1000px; 
            margin: 0 auto;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 20px;
          }
          .order-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0;
            color: #2c5aa0;
          }
          .order-id { 
            color: #666; 
            font-size: 16px;
            margin-top: 5px;
          }
          .order-status {
            background: #f0f7ff;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            color: #2c5aa0;
            border: 1px solid #2c5aa0;
          }
          .grid-layout { 
            display: grid; 
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          .card { 
            border: 1px solid #e5e5e5; 
            border-radius: 8px; 
            margin-bottom: 20px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .card-header { 
            background: #f8f9fa;
            padding: 12px 16px;
            font-weight: bold; 
            font-size: 16px;
            border-bottom: 1px solid #e5e5e5;
            color: #2c5aa0;
          }
          .card-content { 
            padding: 16px;
          }
          .detail-item { 
            margin-bottom: 10px;
          }
          .detail-item label { 
            display: block; 
            font-weight: 600; 
            margin-bottom: 4px;
            color: #555;
            font-size: 13px;
          }
          .detail-item p { 
            margin: 0; 
            padding: 6px 0;
            font-size: 14px;
          }
          .badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: 600;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            margin: 2px;
          }
          .specification-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin: 12px 0;
          }
          .spec-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #2c5aa0;
          }
          .spec-label {
            font-weight: 600;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .spec-value {
            font-size: 13px;
            font-weight: 600;
            color: #333;
          }
          .size-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px;
            margin-top: 10px;
          }
          .size-item { 
            text-align: center; 
            padding: 12px; 
            border: 2px solid #e5e5e5; 
            border-radius: 6px;
            background: #fafafa;
          }
          .size-label { 
            font-weight: 600; 
            margin-bottom: 6px;
            font-size: 13px;
          }
          .size-quantity { 
            font-size: 20px; 
            font-weight: bold;
            color: #2c5aa0;
          }
          .image-container {
            text-align: center;
            margin: 16px 0;
          }
          .product-image {
            max-width: 100%;
            max-height: 250px;
            object-fit: contain;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
          }
          .no-image {
            width: 100%;
            height: 150px;
            border: 2px dashed #e5e5e5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            margin: 0 auto;
            background: #fafafa;
          }
          .summary-box {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #2c5aa0, #3a7bd5);
            border-radius: 8px;
            margin: 16px 0;
            color: white;
          }
          .summary-quantity {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .timeline {
            display: flex;
            justify-content: space-between;
            margin: 16px 0;
          }
          .timeline-item {
            text-align: center;
            flex: 1;
          }
          .timeline-date {
            font-weight: 600;
            color: #2c5aa0;
            font-size: 13px;
          }
          .timeline-label {
            font-size: 11px;
            color: #666;
            margin-top: 4px;
          }
          .colors-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 6px 0;
          }
          .color-badge {
            padding: 4px 8px;
            background: #e3f2fd;
            border: 1px solid #90caf9;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .card { break-inside: avoid; page-break-inside: avoid; }
            .summary-box { background: #2c5aa0 !important; -webkit-print-color-adjust: exact; }
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 11px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2c5aa0;
            margin: 16px 0 10px 0;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 6px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <div>
              <h1 class="order-title">ORDER DETAILS</h1>
              <div class="order-id">Order ID: ${order.product_id}</div>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">${formatDate(order.order_date)}</div>
                  <div class="timeline-label">Order Date</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">${formatDate(order.delivery_date)}</div>
                  <div class="timeline-label">Delivery Date</div>
                </div>
              </div>
            </div>
            <div class="order-status">${order.status}</div>
          </div>

          <div class="grid-layout">
            <div class="card">
              <div class="card-header">Customer Information</div>
              <div class="card-content">
                <div class="detail-item">
                  <label>Customer Name</label>
                  <p>${order.customer_name}</p>
                </div>
                <div class="detail-item">
                  <label>Product Name</label>
                  <p>${order.product_name}</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">Order Summary</div>
              <div class="card-content">
                <div class="summary-box">
                  <div class="summary-quantity">
                    ${order.is_set ? 
                      `${order.quantity} (${Math.floor(order.quantity / (order.set_multiplier || 1))} sets)` : 
                      order.quantity
                    }
                  </div>
                  <div class="summary-label">
                    ${order.is_set ? "TOTAL ITEMS (SETS)" : "TOTAL PIECES"}
                  </div>
                </div>
                
                <div style="display: grid; gap: 10px; margin-top: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #666;">Product ID:</span>
                    <span style="font-weight: 600;">${order.product_id}</span>
                  </div>
                  ${order.is_set ? `
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #666;">Set Type:</span>
                      <span style="font-weight: 600;">${order.set_multiplier} items per set</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #666;">Status:</span>
                    <span style="font-weight: 600; color: #2c5aa0;">${order.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card full-width">
            <div class="card-header">Order Specifications</div>
            <div class="card-content">
              <div class="section-title">Fabric Details</div>
              <div class="specification-grid">
                <div class="spec-item">
                  <div class="spec-label">Fabric Type</div>
                  <div class="spec-value">${order.fabric_type || "Not specified"}</div>
                </div>
                <div class="spec-item">
                  <div class="spec-label">Fabric Weight</div>
                  <div class="spec-value">${order.fabric_weight || "Not specified"}</div>
                </div>
                ${order.is_set ? `
                  <div class="spec-item">
                    <div class="spec-label">Set Configuration</div>
                    <div class="spec-value">Set of ${order.set_multiplier} items</div>
                  </div>
                ` : ''}
              </div>

              <div class="section-title">Colors</div>
              <div class="colors-container">
                ${(order.colours || []).map(color => 
                  `<div class="color-badge">${color}</div>`
                ).join('') || '<div style="color: #666; font-style: italic;">No colors specified</div>'}
              </div>

              <div class="section-title">Size Distribution</div>
              ${(order.size || []).length > 0 ? `
                <div class="size-grid">
                  ${(order.size || []).map(size => `
                    <div class="size-item">
                      <div class="size-label">${size}</div>
                      <div class="size-quantity">${(order.size_quantities || {})[size] || 0}</div>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="color: #666; font-style: italic; text-align: center; padding: 16px;">No sizes specified</div>'}

              <div class="section-title">Available Sizes</div>
              <div style="margin-bottom: 16px;">
                ${(order.size || []).map(size => 
                  `<span class="badge">${size}</span>`
                ).join('') || '<span style="color: #666; font-style: italic;">No sizes specified</span>'}
              </div>

              <div class="section-title">Product Description</div>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #2c5aa0;">
                <p style="margin: 0; color: #555; line-height: 1.5;">
                  ${order.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          <div class="card full-width">
            <div class="card-header">Product Reference</div>
            <div class="card-content">
              <div class="image-container">
                ${imageUrl ? 
                  `<img src="${imageUrl}" alt="${order.product_name}" class="product-image" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'no-image\\'>Image failed to load</div>';" />` : 
                  `<div class="no-image">No product image available</div>`
                }
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Document generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Fabrie Order Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const imageUrl = getImageUrl();
  const sizes = order.size || [];
  const sizeQuantities = order.size_quantities || {};

  return (
    <div className="space-y-6 p-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} disabled={isSaving || isDeleting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Order Details
            </h1>
            <p className="text-muted-foreground">
              Order ID: {order.product_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(order.status)}>
            {order.status}
          </Badge>

          {!isEditing ? (
            <>
              <Button 
                onClick={handlePrintOrder} 
                variant="outline"
                disabled={isSaving || isDeleting}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={onEdit} disabled={isSaving || isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              
              {/* Delete Button with Confirmation Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the order 
                      <strong> {order.product_id}</strong> for customer <strong>{order.customer_name}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Order"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer & Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  {isEditing ? (
                    <Input
                      id="customer-name"
                      value={order.customer_name}
                      onChange={(e) =>
                        onChange("customer_name", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {order.customer_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-name">Product Name</Label>
                  {isEditing ? (
                    <Input
                      id="product-name"
                      value={order.product_name}
                      onChange={(e) =>
                        onChange("product_name", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {order.product_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fabric-type">Fabric Type</Label>
                  {isEditing ? (
                    <Input
                      id="fabric-type"
                      value={order.fabric_type || ""}
                      onChange={(e) =>
                        onChange("fabric_type", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm">
                      {order.fabric_type || "—"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fabric-weight">Fabric Weight</Label>
                  {isEditing ? (
                    <Input
                      id="fabric-weight"
                      value={order.fabric_weight || ""}
                      onChange={(e) =>
                        onChange("fabric_weight", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm">
                      {order.fabric_weight || "—"}
                    </p>
                  )}
                </div>
              </div>

              {order.is_set && (
                <div className="space-y-2">
                  <Label>Set Configuration</Label>
                  <Badge variant="secondary">
                    Set of {order.set_multiplier} items
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-date">Order Date</Label>
                  {isEditing ? (
                    <Input
                      id="order-date"
                      type="date"
                      value={order.order_date}
                      onChange={(e) =>
                        onChange("order_date", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {formatDate(order.order_date)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-date">Delivery Date</Label>
                  {isEditing ? (
                    <Input
                      id="delivery-date"
                      type="date"
                      value={order.delivery_date}
                      onChange={(e) =>
                        onChange("delivery_date", e.target.value)
                      }
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {formatDate(order.delivery_date)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Order Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Colors */}
              <div className="space-y-3">
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {order.colours?.map((color, index) => (
                    <Badge key={index} variant="secondary">
                      {color}
                    </Badge>
                  ))}
                  {(!order.colours || order.colours.length === 0) && (
                    <span className="text-sm text-muted-foreground">
                      No colors specified
                    </span>
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <Label>Available Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <Badge key={size} variant="outline">
                      {size}
                    </Badge>
                  ))}
                  {sizes.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No sizes specified
                    </span>
                  )}
                </div>
              </div>

              {/* Size Distribution */}
              {sizes.length > 0 && (
                <div className="space-y-3">
                  <Label>Size Distribution</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {sizes.map((size) => (
                      <div
                        key={size}
                        className="text-center p-3 border rounded-lg"
                      >
                        <div className="font-medium text-sm">{size}</div>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={sizeQuantities[size] || 0}
                            onChange={(e) =>
                              onSizeQuantityChange(
                                size,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="mt-2 text-center"
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="text-2xl font-bold mt-1">
                            {sizeQuantities[size] || 0}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={order.description || ""}
                    onChange={(e) =>
                      onChange("description", e.target.value)
                    }
                    rows={3}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {order.description || "No description provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        disabled={isSaving || imageUploading}
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving || imageUploading}
                        className="w-full max-w-xs"
                      >
                        {imageUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {imageUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Supported formats: JPG, PNG, GIF.<br />
                        Max size: 5MB
                      </p>
                    </div>
                  </div>
                  <Separator />
                </div>
              )}

              <div className="text-center space-y-4">
                {imageUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={imageUrl}
                      alt={order.product_name || "Product image"}
                      className="w-full max-w-xs h-64 object-contain rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="font-medium">No image available</p>
                  </div>
                )}
                
                {isEditing && !imageUrl && (
                  <p className="text-sm text-muted-foreground">
                    Click "Upload Image" to add a product photo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">
                  {order.is_set
                    ? `${order.quantity} (${Math.floor(
                        order.quantity / (order.set_multiplier || 1)
                      )} sets)`
                    : order.quantity}
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.is_set ? "Total Items (Sets)" : "Total Pieces"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Product ID:
                  </span>
                  <span className="text-sm font-medium">
                    {order.product_id}
                  </span>
                </div>

                {order.is_set && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Set Type:
                    </span>
                    <span className="text-sm font-medium">
                      {order.set_multiplier} items per set
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Status:
                  </span>
                  {isEditing ? (
                    <Select
                      value={order.status}
                      onValueChange={(value: OrderStatus) =>
                        onChange("status", value)
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="cutting">Cutting</SelectItem>
                        <SelectItem value="stitching">Stitching</SelectItem>
                        <SelectItem value="finishing">Finishing</SelectItem>
                        <SelectItem value="Ready for Delivery">
                          Ready for Delivery
                        </SelectItem>
                        <SelectItem value="Delivered">
                          Delivered
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handlePrintOrder}
                disabled={isSaving || isDeleting}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;