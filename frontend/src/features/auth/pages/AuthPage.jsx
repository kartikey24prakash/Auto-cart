import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

const proof = [
  { initials: 'JD', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=2&w=80&h=80&q=80' },
  { initials: 'MK', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=2&w=80&h=80&q=80' },
  { initials: 'AR', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=2&w=80&h=80&q=80' },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('buyer'); // 'buyer' or 'merchant'
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useSession();

  useEffect(() => {
    const requestedRole = searchParams.get('role');
    if (requestedRole === 'merchant' || requestedRole === 'buyer') {
      setRole(requestedRole);
      // Auto-set to signup mode if they clicked "Integrate SDK"
      if (requestedRole === 'merchant') setIsLogin(false);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value || 'demo@autocart.com';
    
    // Log the user in via context
    login(role, email);
    
    // Route to correct dashboard
    navigate(role === 'buyer' ? '/buyer' : '/merchant');
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        <Card className="grid w-full gap-0 p-0 md:grid-cols-2 overflow-hidden shadow-2xl border-border">
          {/* Branded Left Panel */}
          <div className="from-blue-600 to-indigo-900 text-white relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b p-10 md:flex">
            <div className="bg-white/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-2.5">
              <div className="bg-white/15 ring-white/25 flex size-8 items-center justify-center rounded-lg ring-1">
                <div className="bg-white size-3 rotate-45 rounded-[3px]" />
              </div>
              <span className="text-lg font-bold tracking-tight">AutoCart</span>
            </div>
            
            <h2 className="relative mt-auto max-w-[15ch] text-[26px] leading-[1.15] font-semibold tracking-tight text-balance">
              {role === 'merchant' 
                ? 'Scale your revenue securely with AI Agents.' 
                : 'Deploy shopping agents without losing control.'}
            </h2>
            
            <div className="relative mt-8 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {proof.map((p) => (
                  <Avatar key={p.initials} className="ring-blue-500 size-7 ring-2">
                    <AvatarImage src={p.src} alt="" className="object-cover" />
                    <AvatarFallback className="bg-white text-blue-600 text-[10px] font-medium">{p.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-white/85 text-xs">Join 4,000+ businesses on AutoCart</span>
            </div>
          </div>

          {/* Form Right Panel */}
          <div className="flex flex-col justify-center gap-5 p-8 bg-card">
            
            {/* Role Selector */}
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${role === 'buyer' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${role === 'merchant' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Store className="w-3.5 h-3.5" /> Merchant
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-foreground">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </span>
              <span className="text-muted-foreground text-sm">
                {isLogin 
                  ? `Sign in to your ${role} dashboard.` 
                  : role === 'merchant' ? 'Start accepting AI agents securely.' : 'Start delegating purchases securely.'}
              </span>
            </div>

            <Button variant="outline" className="w-full justify-center gap-2">
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <span className="bg-border h-px flex-1" />
              <span className="text-muted-foreground text-[11px] uppercase">or</span>
              <span className="bg-border h-px flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  {isLogin && <a href="#" className="text-blue-400 hover:text-blue-300 text-[11px]">Forgot?</a>}
                </div>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              {!isLogin && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm" className="text-xs">Confirm Password</Label>
                  <Input id="confirm" type="password" placeholder="••••••••" required />
                </div>
              )}
              <Button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white">
                {isLogin ? 'Sign in' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-xs">
              {isLogin ? 'No account? ' : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 font-medium hover:underline">
                {isLogin ? 'Start free trial' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
