import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, LayoutDashboard, ClipboardList,
  Settings, LogOut, Shield, Key, Bot, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';

const buyerNav = [
  { icon: LayoutDashboard, label: 'Command Center', to: '/buyer' },
  { icon: Bot, label: 'AI Agent', to: '/buyer/agent' },
  { icon: ClipboardList, label: 'Approval Inbox', to: '/buyer/approvals' },
  { icon: ShoppingCart, label: 'Privacy Receipts', to: '/buyer/receipts' },
  { icon: Settings, label: 'Mandate Config', to: '/buyer/settings' },
];

const merchantNav = [
  { icon: LayoutDashboard, label: 'Overview', to: '/merchant' },
  { icon: Shield, label: 'Firewall Rules', to: '/merchant/firewall' },
  { icon: ClipboardList, label: 'AI Traffic', to: '/merchant/traffic' },
  { icon: Key, label: 'API Keys', to: '/merchant/keys' },
];

export default function DashboardLayout({ children, role = 'buyer' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useSession();
  const navItems = role === 'buyer' ? buyerNav : merchantNav;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      {/* Sidebar */}
      <aside className={`border-r border-border flex flex-col justify-between py-6 shrink-0 bg-card transition-all duration-300 z-20 ${
        isSidebarOpen ? 'w-64 px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'
      }`}>
        {/* Logo */}
        <div className="w-56">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="bg-blue-600 size-6 rotate-45 rounded-[4px] shrink-0" />
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">AutoCart</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-widest shrink-0">
              {role}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ icon: Icon, label, to }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-2 px-2 w-56">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-destructive transition-colors py-2 w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto bg-background relative min-w-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-30 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground shadow-sm transition-colors"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
        <div className="pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
