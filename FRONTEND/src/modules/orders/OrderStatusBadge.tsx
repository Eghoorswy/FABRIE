import React from "react";
import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusVariant = () => {
    switch (status) {
      case "Delivered":
        return "default";
      case "Ready for Delivery":
        return "secondary";
      case "Pending":
        return "outline";
      case "cutting":
      case "stitching":
      case "finishing":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getStatusVariant()}>
      {status}
    </Badge>
  );
};

export default OrderStatusBadge;