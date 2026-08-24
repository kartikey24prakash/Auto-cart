import { Link, useLocation } from 'react-router-dom';

export default function TerminalFrame({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Audit Terminal' },
    { path: '/agent-studio', label: 'AI Buyer Studio' },
    { path: '/queue', label: 'Approval Queue' },
    { path: '/mandate', label: 'Policy Mandates' },
    { path: '/catalog', label: 'Catalog & Growth' },
  ];

  return (
    <div className="flex flex-col h-full text-[var(--color-term-fg)] max-w-7xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center bg-[var(--color-premium-glass)] backdrop-blur-xl border border-[var(--color-premium-glass-border)] rounded-2xl p-4 px-6 mb-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              SafeAgent <span className="text-blue-400 font-medium">Gateway</span>
            </h1>
          </div>
        </div>

        <nav className="hidden md:flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto relative pb-10">
        {children}
      </main>
    </div>
  );
}