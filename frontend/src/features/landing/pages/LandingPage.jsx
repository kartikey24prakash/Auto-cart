import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full max-w-6xl flex justify-between items-center p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 size-6 rotate-45 rounded-[4px]" />
          <span className="font-bold text-xl tracking-tight">AutoCart</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-20 px-4 lg:px-0 flex mx-auto max-w-6xl flex-col items-center justify-center text-center w-full">
        <div className="grid w-full border-b border-border md:border relative grid-cols-10">
          {/* Background glow */}
          <div
            className="absolute inset-0 -z-20 opacity-20"
            style={{
              background: "radial-gradient(80% 100% at 0% 100%, #3b82f6 50%, #1e1b4b 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 60%)",
              maskImage: "linear-gradient(to top, black 0%, transparent 60%)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          />
          <Plus size={30} strokeWidth={1} className="absolute -top-4 -left-4 text-border" />
          <Plus size={30} strokeWidth={1} className="absolute -bottom-4 -right-4 text-border" />

          {/* Left column grid */}
          <div className="md:grid hidden w-full col-span-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="border-b border-border last:border-0 flex-1 aspect-square" />
            ))}
          </div>

          {/* Center */}
          <div className="md:col-span-8 col-span-10">
            <div className="md:flex hidden">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="border-l border-border last:border-r flex-1 aspect-square" />
              ))}
            </div>

            <div className="relative w-full border border-border -mt-0.5 flex items-center flex-col justify-center py-24 px-6 md:p-32">
              <div className="border border-blue-500/30 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8">
                The Agentic SDK is Live
              </div>
              <h1 className="text-center text-4xl leading-tight font-semibold tracking-tight lg:text-7xl text-foreground">
                Agentic Commerce,<br />
                <span className="text-muted-foreground">Secured.</span>
              </h1>
              <p className="md:text-lg text-muted-foreground py-8 max-w-2xl">
                AutoCart provides developer tools and policy firewalls to build, scale, and secure machine-to-machine commerce. Let AI agents shop your store safely.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/auth?role=merchant">
                  <Button className="rounded-full w-48 h-12 text-base font-medium bg-blue-600 hover:bg-blue-500 text-white">
                    Integrate SDK
                  </Button>
                </Link>
                <Link to="/auth?role=buyer">
                  <Button variant="outline" className="rounded-full w-48 h-12 text-base font-medium">
                    I am a Buyer
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative w-full h-full">
              {Array.from({ length: 2 }).map((_, row) => (
                <div key={row} className="flex">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="border-l border-border border-b last:border-r flex-1 aspect-square" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right column grid */}
          <div className="md:grid hidden col-span-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="border-b border-border last:border-b-0 flex-1 aspect-square" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
