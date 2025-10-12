import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import DashboardHome from "./DashboardHome";
import OrdersRoutes from "../orders/OrdersRoutes";
import FinanceRoutes from "../finance/FinanceRoutes";

const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="orders/*" element={<OrdersRoutes />} />
        <Route path="finance/*" element={<FinanceRoutes />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;