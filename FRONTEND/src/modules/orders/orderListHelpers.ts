import { Order } from "@/types/order";

export function getTotalQuantity(order: Order): number {
  if (!order.size_quantities) return 0;
  
  if (typeof order.size_quantities === "string") {
    try {
      const quantities = JSON.parse(order.size_quantities);
      return Object.values(quantities).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);
    } catch {
      return 0;
    }
  }
  
  return Object.values(order.size_quantities).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);
}

export function filterOrders(orders: Order[], searchQuery: string): Order[] {
  if (!searchQuery.trim()) return orders;
  
  const query = searchQuery.toLowerCase().trim();
  
  return orders.filter((order) =>
    order.product_name.toLowerCase().includes(query) ||
    order.customer_name.toLowerCase().includes(query) ||
    order.product_id.toLowerCase().includes(query) ||
    order.fabric_type?.toLowerCase().includes(query) ||
    order.fabric_weight?.toLowerCase().includes(query)
  );
}

export function calculateOrderStats(orders: Order[]) {
  // Exclude cancelled orders from total items count
  const activeOrders = orders.filter(order => order.status !== 'Cancelled');
  
  const inProgressOrders = orders.filter(o => 
    ['Pending', 'cutting', 'stitching', 'finishing'].includes(o.status)
  );
  
  const readyOrders = orders.filter(o => o.status === 'Ready for Delivery');
  const completedOrders = orders.filter(o => o.status === 'Delivered');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
  
  return {
    totalOrders: orders.length,
    inProgress: inProgressOrders.length,
    ready: readyOrders.length,
    completed: completedOrders.length,
    cancelled: cancelledOrders.length,
    totalItems: activeOrders.reduce((sum, o) => sum + getTotalQuantity(o), 0)
  };
}

// Additional helper for order sorting
export function sortOrders(orders: Order[], sortBy: 'date' | 'customer' | 'status' = 'date', ascending = false): Order[] {
  const sorted = [...orders];
  
  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => 
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );
      break;
    case 'customer':
      sorted.sort((a, b) => 
        a.customer_name.localeCompare(b.customer_name)
      );
      break;
    case 'status':
      sorted.sort((a, b) => 
        a.status.localeCompare(b.status)
      );
      break;
  }
  
  return ascending ? sorted.reverse() : sorted;
}

// Helper for finding overdue orders
export function getOverdueOrders(orders: Order[]): Order[] {
  const today = new Date();
  return orders.filter(order => {
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    const deliveryDate = new Date(order.delivery_date);
    return deliveryDate < today;
  });
}