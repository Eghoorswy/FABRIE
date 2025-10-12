import React from "react";
import { Order } from "@/types/order";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTotalQuantity, filterOrders, calculateOrderStats } from "./orderListHelpers";
import OrderStatusBadge from "./OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderListProps {
  orders: Order[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const OrderList: React.FC<OrderListProps> = ({ 
  orders, 
  searchQuery, 
  setSearchQuery 
}) => {
  const navigate = useNavigate();
  const filteredOrders = filterOrders(orders, searchQuery);
  const stats = calculateOrderStats(orders);

  // ✅ sort orders by latest order_date (descending), memoized for performance
  const sortedOrders = React.useMemo(
    () =>
      [...filteredOrders].sort(
        (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      ),
    [filteredOrders]
  );

  const handleViewDetails = (productId: string) => {
    navigate(productId);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Responsive Horizontal */}
<div className="flex flex-wrap gap-4">
  <Card className="flex-1 min-w-[150px] max-w-[200px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{stats.totalOrders}</div>
    </CardContent>
  </Card>

  <Card className="flex-1 min-w-[150px] max-w-[200px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">In Progress</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-orange-600">
        {stats.inProgress}
      </div>
    </CardContent>
  </Card>

  <Card className="flex-1 min-w-[150px] max-w-[200px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Ready</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-blue-600">{stats.ready}</div>
    </CardContent>
  </Card>

  <Card className="flex-1 min-w-[150px] max-w-[200px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Completed</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-green-600">
        {stats.completed}
      </div>
    </CardContent>
  </Card>

  <Card className="flex-1 min-w-[150px] max-w-[200px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-purple-600">
        {stats.totalItems}
      </div>
    </CardContent>
  </Card>
</div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Orders</CardTitle>
          
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <TableRow key={order.product_id}>
                    <TableCell className="font-medium">{order.product_id}</TableCell>
                    <TableCell>
                      <div>
                        {order.product_name}
                        {order.is_set && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Set ({order.set_multiplier})
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getTotalQuantity(order)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(order.product_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;