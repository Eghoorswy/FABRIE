import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { ensureCSRFToken } from "@/lib/axios";
import { Order } from "@/types/order";
import { toast } from "sonner";

export const useOrderDetail = () => {
  const { product_id } = useParams<{ product_id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product_id) {
      setLoading(false);
      setError("Product ID not found");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<Order>(`/api/orders/${product_id}/`);
        setOrder(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to fetch order details";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [product_id]);

  const updateOrder = async (updatedOrder: FormData | Order) => {
    if (!product_id) return;

    try {
      await ensureCSRFToken();

      const response = await api.put<Order>(
        `/api/orders/${product_id}/`,
        updatedOrder,
        updatedOrder instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {}
      );

      setOrder(response.data);
      toast.success("Order updated successfully");
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to update order";
      console.error("Update error details:", err.response?.data);
      toast.error(errorMessage);
      throw err;
    }
  };

  return { order, loading, error, updateOrder };
};

export default useOrderDetail;