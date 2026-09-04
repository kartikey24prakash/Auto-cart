import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './shared/state/SessionContext';

// Pages
import LandingPage from './features/landing/pages/LandingPage';
import BuyerCommandCenter from './features/buyer/pages/BuyerCommandCenter';
import BuyerAgent from './features/buyer/pages/BuyerAgent';
import BuyerSettings from './features/buyer/pages/BuyerSettings';
import BuyerKeys from './features/buyer/pages/BuyerKeys';

import AuthPage from './features/auth/pages/AuthPage';
import ApprovalQueuePage from './features/approval-queue/pages/ApprovalQueuePage';
import AuditTerminalPage from './features/audit-terminal/pages/AuditTerminalPage';

import MerchantOverview from './features/merchant/pages/MerchantOverview';
import MerchantFirewall from './features/merchant/pages/MerchantFirewall';
import MerchantTraffic from './features/merchant/pages/MerchantTraffic';
import MerchantKeys from './features/merchant/pages/MerchantKeys';
import MerchantAgent from './features/merchant/pages/MerchantAgent';
import MerchantCatalog from './features/merchant/pages/MerchantCatalog';
import MerchantOrders from './features/merchant/pages/MerchantOrders';
import DocsPage from './features/docs/pages/DocsPage';

// Route Guard
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useSession();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/merchant'} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/docs" element={<DocsPage />} />

      {/* Buyer Hub (Protected) */}
      <Route path="/buyer" element={<ProtectedRoute allowedRole="buyer"><BuyerCommandCenter /></ProtectedRoute>} />
      <Route path="/buyer/agent" element={<ProtectedRoute allowedRole="buyer"><BuyerAgent /></ProtectedRoute>} />
      <Route path="/buyer/approvals" element={<ProtectedRoute allowedRole="buyer"><ApprovalQueuePage /></ProtectedRoute>} />
      <Route path="/buyer/receipts" element={<ProtectedRoute allowedRole="buyer"><AuditTerminalPage /></ProtectedRoute>} />
      <Route path="/buyer/settings" element={<ProtectedRoute allowedRole="buyer"><BuyerSettings /></ProtectedRoute>} />
      <Route path="/buyer/keys" element={<ProtectedRoute allowedRole="buyer"><BuyerKeys /></ProtectedRoute>} />

      {/* Merchant Shield (Protected) */}
      <Route path="/merchant" element={<ProtectedRoute allowedRole="merchant"><MerchantOverview /></ProtectedRoute>} />
      <Route path="/merchant/orders" element={<ProtectedRoute allowedRole="merchant"><MerchantOrders /></ProtectedRoute>} />
      <Route path="/merchant/agent" element={<ProtectedRoute allowedRole="merchant"><MerchantAgent /></ProtectedRoute>} />
      <Route path="/merchant/catalog" element={<ProtectedRoute allowedRole="merchant"><MerchantCatalog /></ProtectedRoute>} />
      <Route path="/merchant/firewall" element={<ProtectedRoute allowedRole="merchant"><MerchantFirewall /></ProtectedRoute>} />
      <Route path="/merchant/traffic" element={<ProtectedRoute allowedRole="merchant"><MerchantTraffic /></ProtectedRoute>} />
      <Route path="/merchant/keys" element={<ProtectedRoute allowedRole="merchant"><MerchantKeys /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SessionProvider>
  );
}
