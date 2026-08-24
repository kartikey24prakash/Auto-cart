import React, { useState } from 'react';
import Badge from '../../../shared/components/Badge';

export default function AgentStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  const presets = [
    {
      id: 'auto_micro',
      label: '⚡ Auto-Micro (< ₹500)',
      desc: 'Buy 65W USB-C Cable (₹349) → AUTO_APPROVED',
      prompt: 'Buy 1x Braided 65W USB-C Cable for workstation replacement.',
    },
    {
      id: 'gate_1click_upsell',
      label: '🛒 1-Click + Upsell',
      desc: 'Buy Keyboard (₹2,800) + Accept Cable Upsell (+₹499)',
      prompt: 'Buy 1x RGB Mechanical Keyboard and accept companion accessory within ₹5,000 budget.',
    },
    {
      id: 'gate_2fa',
      label: '🔐 High-Value 2FA (> ₹5,000)',
      desc: 'Buy 4K Monitor (₹24,000) → Queued for TOTP Code',
      prompt: 'Order 1x 27-inch 4K Monitor (₹24,000) for color-calibrated design work.',
    },
    {
      id: 'guest_link',
      label: '🌐 Guest AI Razorpay Link',
      desc: 'Universal Guest Agent → Generates Hosted Payment Link',
      prompt: 'Universal Guest AI shopping via open protocol with instant payment link.',
    },
  ];

  const runSimulation = async (scenarioId = null, customPrompt = null) => {
    setLoading(true);
    setSteps([]);
    setLedger([]);
    setMode(null);

    const activePrompt = customPrompt !== null ? customPrompt : prompt;

    try {
      const resp = await fetch('http://localhost:5000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          scenarioId,
          agentKey: 'agentkey_demo_alpha',
        }),
      });

      const data = await resp.json();
      if (data.steps) setSteps(data.steps);
      if (data.ledger) setLedger(data.ledger);
      if (data.mode) setMode(data.mode);
    } catch (err) {
      console.error('Agent run failed:', err);
      setSteps([
        {
          id: 'err_1',
          type: 'ERROR',
          title: 'Connection Error',
          details: { error: 'Could not connect to SafeAgent Gateway. Ensure backend is running.' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (order) => {
    if (!window.Razorpay) {
      alert('Razorpay Checkout SDK not loaded.');
      return;
    }

    const options = {
      key: 'rzp_test_TOZjfrDBXXsQ78', 
      amount: order.amount * 100, 
      currency: 'INR',
      name: 'SafeAgent Merchant Store',
      description: order.sku || 'Autonomous AI Purchase',
      order_id: order.razorpayOrderId, 
      handler: function (response) {
        alert('Payment Captured Successfully!\nPayment ID: ' + response.razorpay_payment_id);
      },
      prefill: {
        name: 'Test Manager',
        email: 'manager@safeagent.test',
        contact: '9999999999'
      },
      theme: {
        color: '#2563eb' // Tailwind blue-600
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert('Payment failed: ' + response.error.description);
    });
    rzp.open();
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden max-w-7xl mx-auto w-full">
      <div className="bg-card border border-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Autonomous AI Buyer Studio
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
                {mode === 'live_gemini' ? 'Gemini 2.5 Live' : 'Scenario Sandbox'}
              </span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Test natural language AI buyer procurement against SafeAgent deterministic policy walls and Razorpay rails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">Policy Firewall:</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-md">
            ARMED (3 Tiers)
          </span>
        </div>
      </div>

      {/* 1-Click Scenario Presets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPrompt(p.prompt);
              runSimulation(p.id, p.prompt);
            }}
            disabled={loading}
            className="bg-card border border-border rounded-xl p-3 text-left hover:border-foreground/20 hover:bg-muted/50 transition-all cursor-pointer group disabled:opacity-50 shadow-sm"
          >
            <div className="text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors">{p.label}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Prompt Input Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex gap-2 items-center shadow-sm">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Find an ergonomic keyboard and companion cable under ₹4,000..."
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && prompt.trim() && !loading) {
              runSimulation(null, prompt);
            }
          }}
          className="flex-1 bg-background border border-input rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
        />
        <button
          onClick={() => runSimulation(null, prompt)}
          disabled={loading || !prompt.trim()}
          className="px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
              <span>Executing...</span>
            </>
          ) : (
            <>
              <span>▶ Run Agent</span>
            </>
          )}
        </button>
      </div>

      {/* Dual-Column Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Live Agent Reasoning Stream (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Agent Telemetry & Decision Stream
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{steps.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-background/50">
            {steps.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <span className="text-3xl">🤖</span>
                <p>Select a scenario preset above or type a procurement prompt to begin.</p>
              </div>
            )}

            {loading && steps.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="animate-pulse">Gemini Agent reasoning over catalog & policies...</p>
              </div>
            )}

            {steps.map((step) => {
              const badgeColor = {
                THOUGHT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                TOOL_CALL: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                FIREWALL_DECISION: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                UPSELL: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                FINAL_REPORT: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
                ERROR: 'bg-red-500/10 text-red-600 border-red-500/20',
              }[step.type] || 'bg-muted text-muted-foreground border-border';

              return (
                <div key={step.id} className="p-3 rounded-lg bg-card border border-border shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {step.type}
                      </span>
                      <span className="font-semibold text-foreground">{step.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {step.details && Object.keys(step.details).length > 0 && (
                    <pre className="p-2.5 rounded-md bg-muted text-muted-foreground text-[11px] overflow-x-auto border border-border leading-relaxed">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ledger & Direct Payment Action (1 col) */}
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Session Ledger</span>
            <span className="text-xs text-emerald-500 font-mono font-bold">
              ₹{ledger.reduce((acc, t) => acc + (t.amount || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/50">
            {ledger.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4">
                <span>No completed orders yet.</span>
              </div>
            ) : (
              ledger.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-card border border-border shadow-sm space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground font-mono">{item.sku}</div>
                      <div className="text-[11px] text-muted-foreground">Qty: {item.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground font-mono">₹{item.amount?.toLocaleString('en-IN')}</div>
                      <Badge status={item.status} />
                    </div>
                  </div>

                  {item.upsellRef && (
                    <div className="text-[10px] text-purple-600 bg-purple-500/10 p-1.5 rounded border border-purple-500/20 font-mono">
                      ↑ AI Upsell Companion Order Accepted
                    </div>
                  )}

                  {item.paymentUrl && (
                    <a
                      href={item.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md text-xs font-medium transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                    >
                      🔗 Open Hosted Razorpay Link
                    </a>
                  )}

                  {(item.status === 'ORDER_CREATED' || item.status === 'AUTO_APPROVED') && (
                    <button
                      onClick={() => openPaymentModal(item)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                    >
                      💳 Pay with Razorpay Test Modal
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}