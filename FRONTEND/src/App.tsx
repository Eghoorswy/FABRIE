import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardRoutes from "./modules/dashboard/DashboardRoutes";
import { Toaster } from "./components/ui/sonner";
import { ensureCSRFToken } from "@/lib/axios"; // Add this import

function App() {
  useEffect(() => {
    // Ensure CSRF token is available when app loads
    ensureCSRFToken();
  }, []);

  return (
    <div className="size-full">
      <Router>
        <DashboardRoutes />
        <Toaster />
      </Router>
    </div>
  );
}

export default App;