import api from "@/lib/axios";
import { Order, CreateOrderData, UpdateOrderData } from "@/types/order";

export const fetchOrders = async (): Promise<Order[]> => {
  const res = await api.get<Order[]>("/api/orders/");
  return res.data;
};

export const fetchOrder = async (productId: string): Promise<Order> => {
  const res = await api.get<Order>(`/api/orders/${productId}/`);
  return res.data;
};

export const createOrder = async (formData: FormData): Promise<Order> => {
  const res = await api.post<Order>("/api/orders/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateOrder = async (productId: string, formData: FormData): Promise<Order> => {
  const res = await api.put<Order>(`/api/orders/${productId}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/**
 * Update an order by ID
 * @param orderId - The ID of the order to update
 * @param updates - The fields to update
 */
export const patchOrder = async (orderId: string, updates: UpdateOrderData): Promise<Order> => {
  const res = await api.patch<Order>(`/api/orders/${orderId}/`, updates);
  return res.data;
};

/**
 * Delete an order by ID
 * @param orderId - The ID of the order to delete
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  await api.delete(`/api/orders/${orderId}/`);
};