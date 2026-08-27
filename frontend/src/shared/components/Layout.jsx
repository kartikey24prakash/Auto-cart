import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden selection:bg-zinc-800 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-zinc-900 flex items-center px-6 shrink-0 bg-zinc-950/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wide text-zinc-400">Admin Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Top right actions could go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
