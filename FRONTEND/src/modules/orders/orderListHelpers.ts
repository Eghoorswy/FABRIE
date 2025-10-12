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
  if (!searchQuery) return orders;
  
  return orders.filter((order) =>
    order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.product_id.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

export function calculateOrderStats(orders: Order[]) {
  return {
    totalOrders: orders.length,
    inProgress: orders.filter(o => 
      ['Pending', 'cutting', 'stitching', 'finishing'].includes(o.status)
    ).length,
    ready: orders.filter(o => o.status === 'Ready for Delivery').length,
    completed: orders.filter(o => o.status === 'Delivered').length,
    totalItems: orders.reduce((sum, o) => sum + getTotalQuantity(o), 0)
  };
}