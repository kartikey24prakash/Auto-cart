import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Key, Copy, Check, RefreshCw, Terminal, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';
import { motion } from 'framer-motion';

export default function BuyerKeys() {
  const [buyerKey, setBuyerKey] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const keyRes = await apiClient.get('/api/dashboard/keys');
        if (keyRes.data.buyerKey) setBuyerKey(keyRes.data.buyerKey);
      } catch (err) {
        console.error('Failed to fetch API key', err);
      }
    };
    fetchKey();
  }, []);

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure? Any AI plugins using your old key will immediately lose access.')) return;
    setIsGeneratingKey(true);
    try {
      const res = await apiClient.post('/api/dashboard/keys/regenerate');
      setBuyerKey(res.data.buyerKey);
    } catch (err) {
      alert('Failed to regenerate API Key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!buyerKey) return;
    navigator.clipboard.writeText(buyerKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API & SDK Access</h1>
          <p className="text-muted-foreground mt-1">Connect your private AutoCart account to external AI Agents (like ChatGPT).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Key Generator UI */}
            <Card className="p-8 bg-card border-border/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">Private Buyer Key</h2>
                  <p className="text-sm text-muted-foreground">Used to securely authorize your AI agent to spend your budget.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      readOnly
                      value={buyerKey ? buyerKey : 'No key generated yet'}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border/60 rounded-lg p-2.5 pl-3 pr-12 text-sm font-mono text-zinc-600 dark:text-zinc-400 outline-none select-all"
                    />
                    {buyerKey && (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={handleCopyKey}
                        className="absolute right-2 top-2 p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Copy Key"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </motion.button>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRegenerateKey}
                    disabled={isGeneratingKey}
                    className="px-5 py-2 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                    {buyerKey ? 'Regenerate' : 'Generate Key'}
                  </motion.button>
                </div>
              </div>
            </Card>

            {/* SDK Documentation */}
            <Card className="p-8 bg-zinc-950 text-zinc-300 border-zinc-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-zinc-100">Using the AI Agent SDK</h2>
                  <p className="text-sm text-zinc-400">Inject this tool into your AI to let it shop for you.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">1. Install the SDK package</h3>
                  <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 font-mono text-sm">
                    npm install @autocart/ai-tools
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-200">2. Initialize the tool in your codebase</h3>
                  <div className="bg-black/50 border border-zinc-800 rounded-lg p-4 font-mono text-sm leading-relaxed overflow-x-auto">
                    <span className="text-pink-400">import</span> {'{ AutoCartBuyerTool }'} <span className="text-pink-400">from</span> <span className="text-green-300">'@autocart/ai-tools'</span>;<br /><br />
                    <span className="text-blue-400">const</span> shoppingAgent = <span className="text-pink-400">new</span> <span className="text-amber-300">AutoCartBuyerTool</span>({'{'}<br />
                    {'  '}buyerKey: <span className="text-green-300">'{buyerKey || 'YOUR_BUYER_KEY'}'</span><br />
                    {'}'});<br /><br />
                    <span className="text-zinc-500">// Pass this tool to LangChain, Vercel AI SDK, or OpenAI</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">How it works</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>Your AI Agent uses this key to securely identify itself to the AutoCart Trust Engine.</span>
              </li>
              <li className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>When your AI tries to buy something, the Trust Engine intercepts the request.</span>
              </li>
              <li className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>If the purchase is under your Mandate Limit, it goes through automatically. Otherwise, it is sent to your Approval Inbox for 1-Click human review.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
