import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FolderKanban, Users, Settings, LogOut,
  Hash, ChevronDown, ChevronRight, Inbox, Calendar, Activity,
  CreditCard, Globe, Terminal, Blocks, PanelLeftClose, PanelLeftOpen,
  Command, X, ShoppingCart, ClipboardList, Shield, ShieldCheck, Key, Bot, Database
} from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';

// --- NAV GROUPS ---
const buyerGroups = [
  {
    heading: 'Workspace',
    items: [
      { id: '/buyer', title: 'Command Center', icon: LayoutDashboard },
      { id: '/buyer/agent', title: 'Shopping Agent', icon: Bot },
      { id: '/buyer/approvals', title: 'Approval Inbox', icon: ClipboardList },
      { id: '/buyer/receipts', title: 'Privacy Receipts', icon: ShoppingCart },
      { id: '/buyer/settings', title: 'Mandates & Delivery', icon: Settings },
    ]
  }
];

const merchantGroups = [
  {
    heading: 'Business',
    items: [
      { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
      { id: '/merchant', title: 'Overview', icon: LayoutDashboard },
      { id: '/merchant/agent', title: 'Shopping Agent', icon: Bot },
      { id: '/merchant/traffic', title: 'AI Traffic', icon: Activity },
    ]
  },
  {
    heading: 'Trust Engine',
    items: [
      { id: '/merchant/catalog', title: 'Auto-Cart Sync', icon: Database },
      { id: '/merchant/firewall', title: 'Firewall Policies', icon: ShieldCheck },
      { id: '/merchant/keys', title: 'API Keys', icon: Key },
    ]
  }
];

const bottomItems = [
  { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
];

function WorkspaceSwitcher({ role, selected, onSelect, displayName }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = selected || displayName;
  
  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-zinc-800/80 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-zinc-50 text-zinc-950 text-zinc-950 flex items-center justify-center font-semibold text-[13px] shadow-sm">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-zinc-50 truncate max-w-[120px]">{current}</span>
            <span className="text-[11px] text-zinc-400 leading-none">{role === 'buyer' ? 'Buyer Plan' : 'Pro Plan'}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-400/50 group-hover:text-zinc-50/70 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-2xl shadow-black/50 z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {[displayName, 'Personal Workspace'].map(ws => (
              <div 
                key={ws}
                onClick={() => { onSelect?.(ws); setIsOpen(false); }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors ${current === ws ? 'bg-white/10 text-zinc-50 font-medium' : 'text-zinc-50/80 hover:bg-zinc-800/80'}`}
              >
                {ws}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ item, activeId, onSelect, level = 0 }) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
      onSelect(item.id);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none
          ${isActive 
            ? 'bg-zinc-900/50 text-zinc-50 font-medium' 
            : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-50/90'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[16px] h-[16px] transition-colors
              ${isActive ? 'text-zinc-50' : 'text-zinc-400/70 group-hover:text-zinc-50/70'}
            `} 
            strokeWidth={1.5} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.shortcut && (
             <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-zinc-400/60 bg-zinc-950 text-zinc-50/50 border border-zinc-800/50 rounded-[4px] shadow-xs">
               {item.shortcut}
             </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-zinc-50 text-zinc-950/10 text-zinc-50">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-zinc-400/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-zinc-800"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ role, activeId, onSelect, activeWorkspace, onWorkspaceSelect, onLogout, dynamicBuyerGroups, dynamicMerchantGroups, displayName }) {
  const groups = role === 'buyer' ? dynamicBuyerGroups : dynamicMerchantGroups;

  return (
    <div className={`flex flex-col w-[260px] h-full bg-zinc-950 border-zinc-900 border-r border-zinc-800/50 p-3 font-sans`}>
      <WorkspaceSwitcher role={role} selected={activeWorkspace} onSelect={onWorkspaceSelect} displayName={displayName} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        {groups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-zinc-400/50 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activeId={activeId} 
                onSelect={onSelect} 
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-800/50 flex flex-col gap-0.5">
        {bottomItems.map(item => (
          <NavItem 
            key={item.id} 
            item={item} 
            activeId={activeId} 
            onSelect={onSelect} 
          />
        ))}
        {/* Logout Button */}
        <div 
          onClick={onLogout}
          className="group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none text-zinc-400 hover:bg-zinc-800/80 hover:text-red-400/90"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-[16px] h-[16px] transition-colors text-zinc-400/70 group-hover:text-red-400/70" strokeWidth={1.5} />
            <span className="text-[13px] tracking-wide truncate">Sign out</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children, role = 'buyer' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  
  const [isOpen, setIsOpen] = useState(true);
  
  // Calculate display name based on role
  const displayName = user?.role === 'MERCHANT' 
    ? (user?.merchantName || 'My Merchant') 
    : (user?.email?.split('@')[0] || 'Personal Account');
    
  const [activeWorkspace, setActiveWorkspace] = useState(displayName);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dynamicBuyerGroups, setDynamicBuyerGroups] = useState(buyerGroups);
  const [dynamicMerchantGroups, setDynamicMerchantGroups] = useState(merchantGroups);

  // Fetch chats for the AI Agent dropdown (Both Buyer and Merchant)
  useEffect(() => {
    import('@/shared/services/apiClient').then(m => {
      m.default.get('/api/chat').then(res => {
        if (res.data && res.data.chats) {
          const chats = res.data.chats.map(chat => ({
            id: `/${role}/agent?chatId=${chat._id}`,
            title: chat.title || 'New Chat',
            icon: Hash
          }));
          
          const newChildren = chats.length > 0 ? chats : [{ id: `/${role}/agent`, title: 'New Chat', icon: Hash }];

          if (role === 'buyer') {
            setDynamicBuyerGroups(prev => prev.map(group => ({
              ...group,
              items: group.items.map(item => item.title === 'Shopping Agent' ? { ...item, id: '/buyer/agent', children: newChildren } : item)
            })));
          } else {
            setDynamicMerchantGroups(prev => prev.map(group => ({
              ...group,
              items: group.items.map(item => item.title === 'Shopping Agent' ? { ...item, id: '/merchant/agent', children: newChildren } : item)
            })));
          }
        }
      }).catch(console.error);
    });
  }, [role]);

  const groups = role === 'buyer' ? dynamicBuyerGroups : dynamicMerchantGroups;

  // Close search with ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (id) => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    navigate(id);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex w-full h-screen bg-zinc-950 text-zinc-50 overflow-hidden">
      
      {/* Sidebar Container */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-zinc-950 border-zinc-900 ${
          isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <SidebarNav 
          role={role}
          activeId={location.pathname + location.search}
          dynamicBuyerGroups={dynamicBuyerGroups}
          dynamicMerchantGroups={dynamicMerchantGroups}
          onSelect={handleSelect}
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
          onLogout={handleLogout}
          displayName={displayName}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 bg-zinc-950 flex flex-col min-w-0 transition-all duration-300">
         
         {/* Top Navbar Header */}
         <div className="h-14 border-b border-zinc-800/50 flex items-center px-4 justify-between bg-zinc-900/30 backdrop-blur-xl shrink-0">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsOpen(!isOpen)}
               className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-50 transition-colors"
             >
               {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-sm text-zinc-400">
               <span className="truncate">{activeWorkspace}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <div 
                className="w-64 h-8 bg-zinc-900/50 rounded-md hidden md:flex items-center px-3 cursor-text text-zinc-400 text-xs hover:bg-black/10 transition-colors"
                onClick={() => setIsSearchOpen(true)}
             >
               <Search className="w-3.5 h-3.5 mr-2" />
               Search...
               <kbd className="ml-auto font-mono text-[10px] opacity-50">⌘K</kbd>
             </div>
             <div className="w-8 h-8 bg-zinc-50 text-zinc-950/10 text-zinc-50 font-bold flex items-center justify-center rounded-full border border-primary/20">
               {activeWorkspace.charAt(0)}
             </div>
           </div>
         </div>

         {/* Scrollable Children */}
         <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="p-6 md:p-8">
              {children}
            </div>
         </div>
      </div>

      <CommandPalette 
        role={role} 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        navigate={navigate} 
      />
    </div>
  );
}

function CommandPalette({ role, isOpen, onClose, navigate }) {
  const [query, setQuery] = useState('');
  
  if (!isOpen) return null;

  const getCommands = () => {
    let commands = [];
    if (role === 'merchant') {
      commands = [
        { name: 'Go to Overview', path: '/merchant/overview' },
        { name: 'Go to Auto-Cart Sync', path: '/merchant/catalog' },
        { name: 'Go to Firewall Policies', path: '/merchant/firewall' },
        { name: 'Go to AI Traffic Log', path: '/merchant/traffic' },
        { name: 'Go to API Keys', path: '/merchant/keys' },
      ];
    } else {
      commands = [
        { name: 'Go to Command Center', path: '/buyer/dashboard' },
        { name: 'Go to Shopping Agent', path: '/buyer/agent' },
        { name: 'Go to Approval Inbox', path: '/buyer/approvals' },
        { name: 'Go to Privacy Receipts', path: '/buyer/receipts' },
        { name: 'Go to Settings', path: '/buyer/settings' },
      ];
    }
    
    if (!query) return commands;
    return commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  };

  const results = getCommands();

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-zinc-950/80 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-zinc-800/50">
          <Search className="w-[18px] h-[18px] text-zinc-400/70 mr-3 shrink-0" strokeWidth={1.5} />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-zinc-50 placeholder:text-zinc-400/50"
            placeholder="Search commands, pages, or features..."
          />
          <kbd 
            onClick={onClose}
            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-zinc-400/70 bg-zinc-900/50 border border-zinc-700 rounded-[4px] cursor-pointer hover:text-zinc-50 hover:bg-zinc-700 transition-colors"
          >
            ESC
          </kbd>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => { navigate(item.path); onClose(); }}
                className="flex items-center px-3 py-2.5 text-[13px] text-zinc-300 hover:text-zinc-50 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                <Command className="w-4 h-4 mr-3 text-zinc-500" />
                {item.name}
              </div>
            ))
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
              <Command className="w-6 h-6 text-zinc-400/30 mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-zinc-400 font-medium">No results found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
