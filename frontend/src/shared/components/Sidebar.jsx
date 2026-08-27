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
    <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-300 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-50 size-5 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <span className="font-bold text-lg tracking-tighter text-zinc-50">AutoCart</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="px-3 mb-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Overview
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-zinc-900/80 text-zinc-50 shadow-sm border border-zinc-800/50' 
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-zinc-900 mt-auto bg-zinc-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-medium text-xs shadow-md">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Admin</span>
            <span className="text-xs text-zinc-500">admin@autocart.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
