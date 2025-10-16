import React, { useMemo } from "react";
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
  
  const filteredOrders = useMemo(() => 
    filterOrders(orders, searchQuery), 
    [orders, searchQuery]
  );

  const stats = useMemo(() => 
    calculateOrderStats(orders), 
    [orders]
  );

  const sortedOrders = useMemo(() =>
    [...filteredOrders].sort(
      (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
    ),
    [filteredOrders]
  );

  const handleViewDetails = React.useCallback((productId: string) => {
    navigate(productId);
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4">
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="In Progress" value={stats.inProgress} className="text-orange-600" />
        <StatCard title="Ready" value={stats.ready} className="text-blue-600" />
        <StatCard title="Completed" value={stats.completed} className="text-green-600" />
        <StatCard title="Cancelled" value={stats.cancelled} className="text-red-600" />
        <StatCard title="Total Items" value={stats.totalItems} className="text-purple-600" />
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Orders</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Order Date</TableHead>
                  <TableHead className="whitespace-nowrap">Delivery Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length > 0 ? (
                  sortedOrders.map((order) => (
                    <TableRow key={order.product_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium font-mono text-sm">
                        {order.product_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="max-w-[200px] truncate">{order.product_name}</span>
                          {order.is_set && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Set ({order.set_multiplier})
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(order.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(order.delivery_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getTotalQuantity(order)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(order.product_id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {orders.length === 0 ? 'No orders found. ' : 'No orders match your search. '}
                      {searchQuery && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto" 
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, className = "" }) => (
  <Card className="flex-1 min-w-[140px] max-w-[180px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
    </CardContent>
  </Card>
);

export default OrderList;