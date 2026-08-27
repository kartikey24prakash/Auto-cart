'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Check, FileCode2, Cpu, ShieldCheck, Activity } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. Data Structures
// ----------------------------------------------------------------------
const DEMO_CODE = [
  { num: 1, type: 'comment', text: '// Initialize the Auto-Cart Agentic SDK' },
  { num: 2, type: 'empty', text: '' },
  { num: 3, type: 'code', tokens: [
    { text: 'import ', className: 'text-rose-400' },
    { text: '{ ', className: 'text-amber-400' },
    { text: 'AutoCartClient', className: 'text-amber-400' },
    { text: ' } ', className: 'text-amber-400' },
    { text: 'from ', className: 'text-rose-400' },
    { text: '"@autocart/sdk"', className: 'text-emerald-300/90' },
    { text: ';', className: 'text-zinc-500' }
  ]},
  { num: 4, type: 'empty', text: '' },
  { num: 5, type: 'code', tokens: [
    { text: 'const ', className: 'text-rose-400' },
    { text: 'client = ', className: 'text-zinc-300' },
    { text: 'new ', className: 'text-rose-400' },
    { text: 'AutoCartClient', className: 'text-amber-400' },
    { text: '({', className: 'text-zinc-300' }
  ]},
  { num: 6, type: 'code', indent: true, tokens: [
    { text: 'apiKey: ', className: 'text-zinc-400' },
    { text: 'process.env.AUTOCART_KEY', className: 'text-blue-300' },
    { text: ',', className: 'text-zinc-500' }
  ]},
  { num: 7, type: 'code', tokens: [
    { text: '});', className: 'text-zinc-300' }
  ]},
  { num: 8, type: 'empty', text: '' },
  { num: 9, type: 'comment', text: '// Give your AI the tool to buy anything' },
  { num: 10, type: 'code', tokens: [
    { text: 'const ', className: 'text-rose-400' },
    { text: 'checkout = ', className: 'text-zinc-300' },
    { text: 'await ', className: 'text-rose-400' },
    { text: 'client.buy', className: 'text-amber-400' },
    { text: '({', className: 'text-zinc-300' }
  ]},
  { num: 11, type: 'code', indent: true, tokens: [
    { text: 'merchantUrl: ', className: 'text-zinc-400' },
    { text: '"https://snitch.com/autocart"', className: 'text-emerald-300/90' },
    { text: ',', className: 'text-zinc-500' }
  ]},
  { num: 12, type: 'code', indent: true, tokens: [
    { text: 'sku: ', className: 'text-zinc-400' },
    { text: '"snitch-jacket-black"', className: 'text-emerald-300/90' },
    { text: ',', className: 'text-zinc-500' }
  ]},
  { num: 13, type: 'code', indent: true, tokens: [
    { text: 'maxPrice: ', className: 'text-zinc-400' },
    { text: '3000', className: 'text-purple-300' }
  ]},
  { num: 14, type: 'code', tokens: [
    { text: '});', className: 'text-zinc-300' }
  ]},
  { num: 15, type: 'empty', text: '' },
];

const EXPLANATIONS = {
  3: "Import the standard Auto-Cart SDK package from NPM.",
  11: "Pass the destination webhook for the merchant. The SDK handles the cryptographic signature automatically.",
  13: "Set the max budget. If the merchant signs a higher price, the transaction is instantly rejected."
};

const FEATURES = [
  {
    id: 'runtime',
    title: 'Zero-trust cryptography',
    description: 'We don\'t rely on scraped HTML or fragile browser extensions. The merchant\'s backend cryptographically signs the price and routing rules directly.',
    icon: Activity,
    accent: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.15)]',
    proof: {
      label: 'Signed Payload',
      lines: [
        { text: '{', dim: true },
        { text: '  "price": 299900,', dim: false },
        { text: '  "signature": "x-rzp-39f82a..."', dim: false },
        { text: '}', dim: true }
      ]
    }
  },
  {
    id: 'types',
    title: 'Global KYC Network',
    description: 'Every merchant on Auto-Cart is verified through Razorpay Route KYC. Scammers and bad actors are mathematically locked out of the network.',
    icon: ShieldCheck,
    accent: 'text-amber-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)]',
    proof: {
      label: 'Network Status',
      lines: [
        { text: 'Merchant ID: acc_19f8', dim: true },
        { text: 'KYC Status: VERIFIED', dim: false },
        { text: 'Trust Score: 99.8', dim: false }
      ]
    }
  },
  {
    id: 'headless',
    title: 'Headless Execution',
    description: 'No browser contexts. No captchas. No loading spinners. The entire transaction happens Server-to-Server instantly.',
    icon: Cpu,
    accent: 'text-rose-400',
    glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(251,113,133,0.15)]',
    proof: {
      label: 'Request Log',
      lines: [
        { text: 'POST /api/webhooks/razorpay', dim: true },
        { text: 'HTTP/1.1 200 OK', dim: false },
        { text: 'latency: 1.2s', dim: false }
      ]
    }
  }
];

// ----------------------------------------------------------------------
// 2. Individual Sections
// ----------------------------------------------------------------------
function InteractiveCodeHero() {
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section className="flex items-center justify-center p-6 md:p-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>NPM Package</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter">
              Give your AI the keys to the economy.
            </h1>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-lg">
              Install the `@autocart/sdk` and give your Langchain or OpenAI agents the ability to purchase goods autonomously across the entire internet.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Walkthrough</p>
            {[3, 11, 13].map((lineNum) => (
              <button
                key={lineNum}
                onMouseEnter={() => setActiveLine(lineNum)}
                onMouseLeave={() => setActiveLine(null)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group ${
                  activeLine === lineNum 
                    ? 'bg-zinc-900/80 border-zinc-700 shadow-lg shadow-black/50' 
                    : 'bg-transparent border-transparent hover:border-zinc-800 hover:bg-zinc-900/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] transition-colors ${
                    activeLine === lineNum ? 'border-rose-500 text-rose-400' : 'border-zinc-700 text-zinc-500'
                  }`}>
                    {lineNum}
                  </div>
                  <p className={`text-sm transition-colors ${
                    activeLine === lineNum ? 'text-zinc-200' : 'text-zinc-500'
                  }`}>
                    {EXPLANATIONS[lineNum as keyof typeof EXPLANATIONS]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative rounded-xl overflow-hidden bg-[#0d0d0f] border border-zinc-800/80 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111115] border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900/50 rounded-md border border-zinc-800 text-xs text-zinc-400 font-mono">
                  <FileCode2 className="w-3.5 h-3.5 text-zinc-500" />
                  agent.ts
                </div>
              </div>
              <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-4 font-mono text-sm md:text-base leading-loose overflow-x-auto relative">
              {DEMO_CODE.map((line, idx) => {
                const isActive = activeLine === line.num;
                const isDimmed = activeLine !== null && activeLine !== line.num;
                return (
                  <motion.div key={idx} animate={{ opacity: isDimmed ? 0.3 : 1 }} transition={{ duration: 0.2 }} className="flex relative group/line">
                    <AnimatePresence>
                      {isActive && (
                        <motion.div layoutId="active-line-bg" className="absolute inset-y-0 -inset-x-4 bg-zinc-800/40 border-l-2 border-rose-400 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
                      )}
                    </AnimatePresence>
                    <span className="w-8 flex-shrink-0 text-right pr-4 text-zinc-600 select-none relative z-10">{line.num}</span>
                    <span className={`relative z-10 whitespace-pre ${line.indent ? 'pl-4' : ''}`}>
                      {line.type === 'comment' && <span className="text-zinc-500">{line.text}</span>}
                      {line.type === 'code' && line.tokens?.map((token, tIdx) => <span key={tIdx} className={token.className}>{token.text}</span>)}
                      {line.type === 'empty' && <span>{'\n'}</span>}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaimAndProofFeatures() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="px-6 md:px-12 lg:px-24 py-32 flex items-center relative z-20">
      <div className="max-w-6xl mx-auto space-y-16 w-full">
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter">Engineered for security.</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Auto-Cart is built to enforce strict boundaries between AI logic, transaction state, and human verification.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              onMouseEnter={() => setHoveredId(feature.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative flex flex-col bg-[#111115] border border-zinc-800/80 rounded-3xl overflow-hidden transition-all duration-500 hover:border-zinc-700 hover:bg-[#15151a] ${feature.glow}`}
            >
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-start relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl bg-zinc-900 border border-zinc-800/50 ${feature.accent} transition-colors duration-300`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100">{feature.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed">{feature.description}</p>
              </div>
              <div className="border-t border-zinc-800/50 bg-[#0d0d0f] relative overflow-hidden flex flex-col mt-auto h-40">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-[#111115]">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{feature.proof.label}</span>
                  <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center font-mono text-sm leading-relaxed relative">
                  <div className="absolute inset-4 flex flex-col justify-center transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                     <div className="h-2 w-3/4 bg-zinc-800/50 rounded mb-3" />
                     <div className="h-2 w-1/2 bg-zinc-800/50 rounded mb-3" />
                     <div className="h-2 w-5/6 bg-zinc-800/50 rounded" />
                  </div>
                  <div className="relative z-10 transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                    {feature.proof.lines.map((line, idx) => (
                      <motion.div 
                        key={idx}
                        initial={false}
                        animate={{ color: line.dim ? '#71717a' : '#d4d4d8' }}
                        className={`whitespace-pre ${line.dim ? '' : feature.accent.replace('text-', 'text-')}`}
                        style={!line.dim ? { color: feature.accent === 'text-emerald-400' ? '#34d399' : feature.accent === 'text-amber-400' ? '#fbbf24' : '#fb7185' } : {}}
                      >
                        {line.text}
                      </motion.div>
                    ))}
                  </div>
                  <AnimatePresence>
                    {hoveredId === feature.id && (
                      <motion.div
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 0.5, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                        className={`absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent to-${feature.accent.split('-')[1]}-500/10 pointer-events-none`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DevToolSection() {
  return (
    <div className="w-full bg-transparent">
      <InteractiveCodeHero />
      <ClaimAndProofFeatures />
    </div>
  );
}
