import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { CrowdCanvas } from "@/components/ui/skiper-ui/skiper39";
import { SpringMouseFollow } from "@/components/ui/skiper-ui/skiper61";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { Skiper89 } from "@/components/ui/skiper-ui/skiper89";
import { Skiper19 } from "@/components/ui/skiper-ui/skiper19";
import { Skiper37 } from "@/components/ui/skiper-ui/skiper37";

export default function LandingPage() {
  const featuresRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start start", "end end"]
  });

  const { scrollY } = useScroll();
  const [navHidden, setNavHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setNavHidden(true);
    } else {
      setNavHidden(false);
    }
  });

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 font-sans overflow-x-hidden selection:bg-zinc-800 selection:text-white">
      {/* Global Scroll Progress */}
      <Skiper89 />

      {/* Glass Navbar */}
      <motion.nav 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" }
        }}
        animate={navHidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 w-full z-50 backdrop-blur-md bg-zinc-950/70 border-b border-zinc-800/50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-50 size-6 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            <span className="font-bold text-xl tracking-tighter">AutoCart</span>
          </div>
          
          <div className="hidden md:flex gap-10 items-center text-sm font-medium text-zinc-300">
            <Link to="/auth?role=buyer" className="hover:text-zinc-50 transition-colors">
              <TextRoll center>Buyer Agents</TextRoll>
            </Link>
            <Link to="/auth?role=merchant" className="hover:text-zinc-50 transition-colors">
              <TextRoll center>Merchant SDK</TextRoll>
            </Link>
            <a href="#" className="hover:text-zinc-50 transition-colors">
              <TextRoll center>Documentation</TextRoll>
            </a>
          </div>

          <div>
            <Link to="/auth?role=merchant">
              <Button className="rounded-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 px-6 font-semibold border border-zinc-200">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Crowd Canvas Background - z-0 with lower opacity */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen">
          <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
        </div>
        
        {/* Mouse Follow Glow - pointer-events-none ensures it doesn't block clicks */}
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-difference">
          <SpringMouseFollow />
        </div>

        {/* Hero Content - relative z-20 to sit above background effects */}
        <div className="relative z-20 text-center max-w-5xl px-4 flex flex-col items-center">
          <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] mb-8 text-zinc-400">
            The Trust Gateway for AI
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.95] mb-8 text-zinc-50">
            Headless Checkout. <br className="hidden md:block" />
            <span className="text-zinc-400">Zero Friction.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            AutoCart connects autonomous AI agents to your merchant catalog securely. 
            Authenticate, negotiate, and verify instantly across servers using our Razorpay-backed Trust Engine. Protect your inventory while unlocking the agentic economy.
          </p>
          
          <div className="flex gap-4">
            <Link to="/auth?role=merchant">
              <Button className="rounded-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 px-8 py-6 text-lg font-bold shadow-2xl shadow-zinc-50/10 border border-zinc-300 transition-all hover:scale-105 active:scale-95">
                Deploy Gateway
              </Button>
            </Link>
          </div>
        </div>

        {/* Seamless Fade-Out Mask for the Hero Section bottom edge */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none"></div>
      </div>

      {/* Stats Section with Animated Numbers */}
      <div className="relative z-30 w-full py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <h3 className="text-6xl font-bold tracking-tighter font-mono flex items-center">
              <Skiper37 value={12500} /><span className="text-4xl text-zinc-500 ml-1">+</span>
            </h3>
            <p className="text-zinc-500 uppercase tracking-[0.15em] text-xs font-semibold">AI Agents Connected</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3">
            <h3 className="text-6xl font-bold tracking-tighter font-mono flex items-center">
              <span className="text-4xl text-zinc-500 mr-1">$</span><Skiper37 value={2.5} /><span className="text-4xl text-zinc-500 ml-1">M+</span>
            </h3>
            <p className="text-zinc-500 uppercase tracking-[0.15em] text-xs font-semibold">Revenue Protected</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3">
            <h3 className="text-6xl font-bold tracking-tighter font-mono flex items-center">
              <Skiper37 value={1.2} /><span className="text-4xl text-zinc-500 ml-1">s</span>
            </h3>
            <p className="text-zinc-500 uppercase tracking-[0.15em] text-xs font-semibold">Verification Speed</p>
          </div>
        </div>
      </div>

      {/* Features Section with Scroll Architecture */}
      <div ref={featuresRef} className="relative w-full py-40 min-h-[250vh]">
        {/* SVG Scroll Path - positioned to start just behind the title */}
        <div className="absolute left-1/2 -top-[55vh] h-full w-[1278px] opacity-25 pointer-events-none -translate-x-[70%] flex justify-center z-0">
          <Skiper19 scrollYProgress={scrollYProgress} className="w-full h-full object-cover" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col gap-[30vh]">
          
          <div className="text-center max-w-3xl mx-auto mb-[10vh]">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              The Agentic Supply Chain
            </h2>
            <p className="text-xl text-zinc-400">
              A frictionless protocol designed exclusively for non-human buyers.
            </p>
          </div>
          
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 p-10 border border-zinc-800/50 bg-zinc-900/30 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
              <div className="size-14 bg-zinc-50 text-zinc-950 rounded-2xl mb-8 flex items-center justify-center text-xl font-bold font-mono">
                01
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">The AI Firewall (Trust Engine)</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Set the boundaries. Let AI do the rest. Never worry about an AI agent hallucinating a massive purchase. Configure strict spending limits, velocity constraints, and approved product categories. Transactions within your parameters execute instantly. Anomalies are blocked.
              </p>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              {/* Placeholder for feature visual */}
              <div className="w-full max-w-md aspect-square rounded-[2.5rem] border border-zinc-800 bg-zinc-900/20 backdrop-blur flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent"></div>
                <span className="text-zinc-700 font-mono text-sm tracking-widest uppercase">Firewall Rules Engine</span>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="flex justify-center">
              {/* Placeholder for feature visual */}
              <div className="w-full max-w-md aspect-square rounded-[2.5rem] border border-zinc-800 bg-zinc-900/20 backdrop-blur flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-zinc-800/20 to-transparent"></div>
                <span className="text-zinc-700 font-mono text-sm tracking-widest uppercase">WhatsApp Integration</span>
              </div>
            </div>
            <div className="p-10 border border-zinc-800/50 bg-zinc-900/30 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
              <div className="size-14 bg-zinc-50 text-zinc-950 rounded-2xl mb-8 flex items-center justify-center text-xl font-bold font-mono">
                02
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Out-of-Band Approvals</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                When a transaction exceeds the AI's autonomous budget, the Trust Engine intercepts it. AutoCart instantly pushes a secure, cryptographically-signed Magic Link to your phone via WhatsApp or Telegram. Review the cart and approve with Razorpay in a single tap.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 p-10 border border-zinc-800/50 bg-zinc-900/30 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
              <div className="size-14 bg-zinc-50 text-zinc-950 rounded-2xl mb-8 flex items-center justify-center text-xl font-bold font-mono">
                03
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Zero-Trust Cryptography</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                A rogue AI cannot manipulate prices. AutoCart uses cross-server cryptographic signatures and native Razorpay Webhook validation. The Buyer SDK, the Merchant Webhook, and the Trust Gateway form an unbreakable cryptographic triangle.
              </p>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              {/* Placeholder for feature visual */}
              <div className="w-full max-w-md aspect-square rounded-[2.5rem] border border-zinc-800 bg-zinc-900/20 backdrop-blur flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800/20 to-transparent"></div>
                <span className="text-zinc-700 font-mono text-sm tracking-widest uppercase">Razorpay Webhooks</span>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="flex justify-center">
              {/* Placeholder for feature visual */}
              <div className="w-full max-w-md aspect-square rounded-[2.5rem] border border-zinc-800 bg-zinc-900/20 backdrop-blur flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tl from-zinc-800/20 to-transparent"></div>
                <span className="text-zinc-700 font-mono text-sm tracking-widest uppercase">Node.js Drop-in SDK</span>
              </div>
            </div>
            <div className="p-10 border border-zinc-800/50 bg-zinc-900/30 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
              <div className="size-14 bg-zinc-50 text-zinc-950 rounded-2xl mb-8 flex items-center justify-center text-xl font-bold font-mono">
                04
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Drop-In Merchant SDK</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Integrate in under 10 minutes. Our lightweight Node.js SDK wraps your existing catalog endpoints, instantly translating your standard API responses into cryptographically-signed AutoCart manifests ready for AI consumption.
              </p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center bg-zinc-950 relative z-30">
        <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">© 2026 AutoCart Protocol</p>
      </footer>
    </div>
  );
}
