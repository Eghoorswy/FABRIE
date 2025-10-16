import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  DollarSign,
  Package,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import api from '@/lib/axios';
import { Order, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/lib/utils';

// Define the DashboardStats interface
interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalReserve: number;
  recentOrders: Order[];
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalReserve: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Ready for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cutting':
      case 'stitching':
      case 'finishing':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Order[]>('/api/orders/');
      const orders = response.data || [];
      
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => 
        ['Pending', 'cutting', 'stitching', 'finishing'].includes(order.status)
      ).length;
      const completedOrders = orders.filter(order => 
        order.status === 'Delivered'
      ).length;
      const readyForDelivery = orders.filter(order => 
        order.status === 'Ready for Delivery'
      ).length;

      // Get in-progress orders sorted by date (most recent first)
      const inProgressOrders = orders
        .filter(order => ['Pending', 'cutting', 'stitching', 'finishing', 'Ready for Delivery'].includes(order.status))
        .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
        .slice(0, 5);

      // Calculate total reserve: sum of quantities from delivered orders multiplied by 15
      const deliveredOrders = orders.filter(order => order.status === 'Delivered');
      const totalDeliveredItems = deliveredOrders.reduce((total, order) => total + (order.quantity || 0), 0);
      const totalReserve = totalDeliveredItems * 15;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalReserve,
        recentOrders: inProgressOrders
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add quick action handlers
  const handleCreateOrder = () => {
    navigate('/orders/new');
  };

  const handleManageFinances = () => {
    navigate('/finance');
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleViewAllOrders = () => {
    navigate('/orders');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back to your business dashboard</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Delivered orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reserve</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReserve)}</div>
            <p className="text-xs text-muted-foreground">Based on delivered items × 15</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent In-Progress Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={handleViewAllOrders}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div 
                    key={order.product_id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-pointer group"
                    onClick={() => handleOrderClick(order.product_id)}
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium group-hover:text-accent-foreground">
                        {order.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                        Ordered: {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-medium group-hover:text-accent-foreground">
                        {order.quantity} items
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No in-progress orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={handleCreateOrder}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create New Order
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports (Coming Soon)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleManageFinances}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Finances
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;