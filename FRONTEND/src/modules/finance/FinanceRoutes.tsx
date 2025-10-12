import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FinanceHome from "./FinanceHome";
import CategoryList from "./CategoryList";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";

const FinanceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<FinanceHome />} />
      <Route path="transactions" element={<TransactionList />} />
      <Route path="categories" element={<CategoryList />} />
      <Route path="transactions/new" element={<TransactionForm />} />
      <Route path="transactions/:id/edit" element={<TransactionForm />} />
      <Route path="*" element={<Navigate to="/finance" replace />} />
    </Routes>
  );
};

export default FinanceRoutes;