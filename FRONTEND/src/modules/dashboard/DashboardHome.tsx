import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Users,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { Order, OrderStatus } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalReserve: number;
  recentOrders: Order[];
  readyForDelivery: number;
  overdueOrders: number;
  totalCustomers: number;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalReserve: 0,
    recentOrders: [],
    readyForDelivery: 0,
    overdueOrders: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = useCallback((status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Ready for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cutting': 'bg-orange-100 text-orange-800 border-orange-200',
      'stitching': 'bg-orange-100 text-orange-800 border-orange-200',
      'finishing': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getDaysUntilDelivery = useCallback((deliveryDate: string): number => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Order[]>('/api/orders/');
      const orders = response.data || [];
      
      // Calculate stats
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

      // Calculate overdue orders
      const today = new Date();
      const overdueOrders = orders.filter(order => {
        if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
        const deliveryDate = new Date(order.delivery_date);
        return deliveryDate < today;
      }).length;

      // Get unique customers
      const uniqueCustomers = new Set(orders.map(order => order.customer_name)).size;

      // Get urgent orders (closest delivery date first, excluding delivered/cancelled)
      const urgentOrders = orders
        .filter(order => 
          !['Delivered', 'Cancelled'].includes(order.status) &&
          getDaysUntilDelivery(order.delivery_date) <= 7 // Only show orders due within 7 days
        )
        .sort((a, b) => getDaysUntilDelivery(a.delivery_date) - getDaysUntilDelivery(b.delivery_date))
        .slice(0, 5);

      // Calculate total reserve
      const deliveredOrders = orders.filter(order => order.status === 'Delivered');
      const totalDeliveredItems = deliveredOrders.reduce((total, order) => total + (order.quantity || 0), 0);
      const totalReserve = totalDeliveredItems * 15;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalReserve,
        recentOrders: urgentOrders,
        readyForDelivery,
        overdueOrders,
        totalCustomers: uniqueCustomers
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getDaysUntilDelivery]);

  const handleCreateOrder = useCallback(() => {
    navigate('/orders/new');
  }, [navigate]);

  const handleManageFinances = useCallback(() => {
    navigate('/finance');
  }, [navigate]);

  const handleOrderClick = useCallback((orderId: string) => {
    navigate(`/orders/${orderId}`);
  }, [navigate]);

  const handleViewAllOrders = useCallback(() => {
    navigate('/orders');
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back to your business dashboard</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Primary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          description="All time orders"
          icon={ShoppingCart}
        />
        <StatCard
          title="In Progress"
          value={stats.pendingOrders}
          description="Active orders"
          icon={Clock}
        />
        <StatCard
          title="Ready for Delivery"
          value={stats.readyForDelivery}
          description="Ready to be delivered"
          icon={Package}
          valueClassName="text-blue-600"
        />
        <StatCard
          title="Total Reserve"
          value={formatCurrency(stats.totalReserve)}
          description="Based on delivered items × 15"
          icon={DollarSign}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          description="Unique customers"
          icon={Users}
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          description="Successfully delivered"
          icon={CheckCircle}
          valueClassName="text-green-600"
        />
        <StatCard
          title="Overdue Orders"
          value={stats.overdueOrders}
          description="Past delivery date"
          icon={AlertTriangle}
          valueClassName={stats.overdueOrders > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Urgent Orders - Need Attention</CardTitle>
            <Button variant="outline" size="sm" onClick={handleViewAllOrders}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <OrderList 
              orders={stats.recentOrders}
              onOrderClick={handleOrderClick}
              getStatusColor={getStatusColor}
              getDaysUntilDelivery={getDaysUntilDelivery}
            />
          </CardContent>
        </Card>

        <QuickActionsPanel
          onCreateOrder={handleCreateOrder}
          onManageFinances={handleManageFinances}
          onViewAllOrders={handleViewAllOrders}
          stats={stats}
        />
      </div>
    </div>
  );
};

// Sub-components for better organization
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  valueClassName = "" 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

interface OrderListProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  getStatusColor: (status: OrderStatus) => string;
  getDaysUntilDelivery: (deliveryDate: string) => number;
}

const OrderList: React.FC<OrderListProps> = ({ 
  orders, 
  onOrderClick, 
  getStatusColor, 
  getDaysUntilDelivery 
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No urgent orders</p>
        <p className="text-sm mt-1">All orders are up to date!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const daysUntilDelivery = getDaysUntilDelivery(order.delivery_date);
        const isOverdue = daysUntilDelivery < 0;
        
        return (
          <div 
            key={order.product_id} 
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-pointer group"
            onClick={() => onOrderClick(order.product_id)}
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium group-hover:text-accent-foreground truncate">
                  {order.product_name}
                </p>
                {order.is_set && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Set ({order.set_multiplier})
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 truncate">
                {order.customer_name} • {order.quantity} items
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                  Due: {formatDate(order.delivery_date)}
                </p>
                {isOverdue ? (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    Overdue
                  </Badge>
                ) : daysUntilDelivery <= 2 && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs shrink-0">
                    Due in {daysUntilDelivery} day{daysUntilDelivery !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2 shrink-0">
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface QuickActionsPanelProps {
  onCreateOrder: () => void;
  onManageFinances: () => void;
  onViewAllOrders: () => void;
  stats: DashboardStats;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onCreateOrder,
  onManageFinances,
  onViewAllOrders,
  stats
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button className="w-full justify-start" onClick={onCreateOrder}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Create New Order
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={onManageFinances}>
        <DollarSign className="h-4 w-4 mr-2" />
        Manage Finances
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={onViewAllOrders}>
        <TrendingUp className="h-4 w-4 mr-2" />
        View All Orders
      </Button>
      
      {/* Quick Stats */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-3">Quick Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ready for Delivery:</span>
            <span className="font-medium text-blue-600">{stats.readyForDelivery}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overdue Orders:</span>
            <span className={`font-medium ${stats.overdueOrders > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.overdueOrders}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Customers:</span>
            <span className="font-medium">{stats.totalCustomers}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
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

    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map(i => (
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

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
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

export default DashboardHome;