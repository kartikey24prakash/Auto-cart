import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, LayoutDashboard, ClipboardList,
  Settings, LogOut, Shield, Key
} from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';

const buyerNav = [
  { icon: LayoutDashboard, label: 'Command Center', to: '/buyer' },
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col justify-between py-6 px-4 shrink-0 bg-card">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="bg-blue-600 size-6 rotate-45 rounded-[4px]" />
            <span className="font-bold text-lg tracking-tight">AutoCart</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-widest">
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
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-2 px-2">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-destructive transition-colors py-2 w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
