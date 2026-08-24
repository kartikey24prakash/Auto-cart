import { Link, useLocation } from 'react-router-dom';
import { Home, Shield, Box, Bot, CheckSquare } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Agent Studio', path: '/agent-studio', icon: Bot },
  { name: 'Approval Queue', path: '/queue', icon: CheckSquare },
  { name: 'Mandates', path: '/mandate', icon: Shield },
  { name: 'Catalog', path: '/catalog', icon: Box },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <span className="text-xl font-bold text-sidebar-foreground tracking-tight">SafeAgent</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Overview
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">Admin</span>
            <span className="text-xs text-muted-foreground">admin@safeagent.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
