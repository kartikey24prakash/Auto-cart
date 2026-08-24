import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './shared/state/SessionContext';

// Pages
import LandingPage from './features/landing/pages/LandingPage';
import AuthPage from './features/auth/pages/AuthPage';
import BuyerCommandCenter from './features/buyer/pages/BuyerCommandCenter';
import ApprovalQueuePage from './features/approval-queue/pages/ApprovalQueuePage';
import AuditTerminalPage from './features/audit-terminal/pages/AuditTerminalPage';
import MandatePage from './features/policy-mandates/pages/MandatePage';

import MerchantOverview from './features/merchant/pages/MerchantOverview';
import MerchantFirewall from './features/merchant/pages/MerchantFirewall';
import MerchantTraffic from './features/merchant/pages/MerchantTraffic';
import MerchantKeys from './features/merchant/pages/MerchantKeys';

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

      {/* Buyer Hub (Protected) */}
      <Route path="/buyer" element={<ProtectedRoute allowedRole="buyer"><BuyerCommandCenter /></ProtectedRoute>} />
      <Route path="/buyer/approvals" element={<ProtectedRoute allowedRole="buyer"><ApprovalQueuePage /></ProtectedRoute>} />
      <Route path="/buyer/receipts" element={<ProtectedRoute allowedRole="buyer"><AuditTerminalPage /></ProtectedRoute>} />
      <Route path="/buyer/settings" element={<ProtectedRoute allowedRole="buyer"><MandatePage /></ProtectedRoute>} />

      {/* Merchant Shield (Protected) */}
      <Route path="/merchant" element={<ProtectedRoute allowedRole="merchant"><MerchantOverview /></ProtectedRoute>} />
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
