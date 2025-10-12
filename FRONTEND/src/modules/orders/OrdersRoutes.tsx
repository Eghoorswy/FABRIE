import React from "react";
import { Routes, Route } from "react-router-dom";
import Orders from "./Orders";
import OrderDetail from "./OrderDetail";
import OrderForm from "./OrderForm";

const OrdersRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Orders />} />
      <Route path="new" element={<OrderForm />} />
      <Route path=":product_id" element={<OrderDetail />} />
      <Route 
        path="*" 
        element={
          <div className="text-center p-6">
            <h2 className="text-xl font-semibold">Page not found</h2>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        } 
      />
    </Routes>
  );
};

export default OrdersRoutes;