import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FolderKanban, Users, Settings, LogOut,
  Hash, ChevronDown, ChevronRight, Inbox, Calendar, Activity,
  CreditCard, Globe, Terminal, Blocks, PanelLeftClose, PanelLeftOpen,
  Command, X, ShoppingCart, ClipboardList, Shield, Key, Bot
} from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';

// --- NAV GROUPS ---
const buyerGroups = [
  {
    heading: 'Workspace',
    items: [
      { id: '/buyer', title: 'Command Center', icon: LayoutDashboard },
      { id: '/buyer/agent', title: 'AI Agent', icon: Bot },
      { id: '/buyer/approvals', title: 'Approval Inbox', icon: ClipboardList },
      { id: '/buyer/receipts', title: 'Privacy Receipts', icon: ShoppingCart },
      { id: '/buyer/settings', title: 'Mandates & Delivery', icon: Settings },
    ]
  }
];

const merchantGroups = [
  {
    heading: '',
    items: [
      { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
      { id: '/merchant', title: 'Overview', icon: LayoutDashboard },
      { id: '/merchant/agent', title: 'AI Agent', icon: Bot },
      { id: '/merchant/traffic', title: 'AI Traffic', icon: Activity },
    ]
  },
  {
    heading: 'Management',
    items: [
      { id: '/merchant/catalog', title: 'Catalog', icon: FolderKanban },
      { id: '/merchant/firewall', title: 'Firewall', icon: Shield },
    ]
  },
  {
    heading: 'Developers',
    items: [
      { id: '/merchant/keys', title: 'API Keys', icon: Terminal },
    ]
  }
];

const bottomItems = [
  { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
];

function WorkspaceSwitcher({ role, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = selected || (role === 'buyer' ? 'Personal Account' : 'Acme Corp');
  
  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-foreground flex items-center justify-center font-semibold text-[13px] shadow-sm">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-foreground truncate max-w-[120px]">{current}</span>
            <span className="text-[11px] text-muted-foreground leading-none">{role === 'buyer' ? 'Buyer Plan' : 'Pro Plan'}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-card border border-border/50 rounded-lg shadow-xl z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {['Acme Corp', 'Personal Workspace'].map(ws => (
              <div 
                key={ws}
                onClick={() => { onSelect?.(ws); setIsOpen(false); }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors ${current === ws ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
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
            ? 'bg-black/5 dark:bg-white/10 text-foreground font-medium' 
            : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground/90'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[16px] h-[16px] transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'}
            `} 
            strokeWidth={1.5} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.shortcut && (
             <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded-[4px] shadow-xs">
               {item.shortcut}
             </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
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
              className="absolute top-0 bottom-0 border-l border-black/5 dark:border-white/5"
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

function SidebarNav({ role, activeId, onSelect, activeWorkspace, onWorkspaceSelect, onLogout, dynamicBuyerGroups, dynamicMerchantGroups }) {
  const groups = role === 'buyer' ? dynamicBuyerGroups : dynamicMerchantGroups;

  return (
    <div className={`flex flex-col w-[260px] h-full bg-card/50 border-r border-border/50 p-3 font-sans`}>
      <WorkspaceSwitcher role={role} selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        {groups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
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

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-0.5">
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
          className="group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-destructive/90"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-[16px] h-[16px] transition-colors text-muted-foreground/70 group-hover:text-destructive/70" strokeWidth={1.5} />
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
  const { logout } = useSession();
  
  const [isOpen, setIsOpen] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState(role === 'buyer' ? 'Personal Account' : 'Acme Corp');
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
              items: group.items.map(item => item.title === 'AI Agent' ? { ...item, id: '/buyer/agent', children: newChildren } : item)
            })));
          } else {
            setDynamicMerchantGroups(prev => prev.map(group => ({
              ...group,
              items: group.items.map(item => item.title === 'AI Agent' ? { ...item, id: '/merchant/agent', children: newChildren } : item)
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
    <div className="flex w-full h-screen bg-background overflow-hidden">
      
      {/* Sidebar Container */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-card/50 ${
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
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col min-w-0 transition-all duration-300">
         
         {/* Top Navbar Header */}
         <div className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-card shrink-0">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsOpen(!isOpen)}
               className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors"
             >
               {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <span className="truncate">{activeWorkspace}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <div 
                className="w-64 h-8 bg-black/5 dark:bg-white/5 rounded-md hidden md:flex items-center px-3 cursor-text text-muted-foreground text-xs hover:bg-black/10 transition-colors"
                onClick={() => setIsSearchOpen(true)}
             >
               <Search className="w-3.5 h-3.5 mr-2" />
               Search...
               <kbd className="ml-auto font-mono text-[10px] opacity-50">⌘K</kbd>
             </div>
             <div className="w-8 h-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full border border-primary/20">
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

      {/* Global Command Palette / Search */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 border-b border-border/50">
              <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                autoFocus
                className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
                placeholder="Search projects, logs, or keys..."
              />
              <kbd 
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-[4px] cursor-pointer hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
              >
                ESC
              </kbd>
            </div>
            <div className="p-2 py-8 flex flex-col items-center justify-center">
               <Command className="w-6 h-6 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
               <p className="text-[13px] text-muted-foreground font-medium">Type a command or search...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
