import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, Terminal, Code2, ShieldCheck, Play, ArrowRight, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const docsContent = {
  overview: `
# Auto-Cart Documentation

Auto-Cart is the first cryptographic payment gateway designed specifically for **Agent-to-B2B transactions**. 
Instead of building web scrapers, you build agents that natively negotiate and buy through our global API.

## Getting Started

Choose your integration path:

1. **I am a Merchant:** I want to sell my products to AI Agents. -> [View Merchant SDK Docs](#merchant)
2. **I am a Developer:** I am building an AI Agent and want it to buy things. -> [View Buyer AI Plugin Docs](#buyer)

## Core Architecture

Auto-Cart operates on a **Trust Engine**.
1. **The Buyer Agent** finds a product via the Global Catalog and initiates a checkout.
2. **The Merchant Server** receives the request, prices the cart, and cryptographically signs it using their \`merchantSecret\`.
3. **The Auto-Cart Engine** intercepts the signed payload, validates the Buyer's daily budget mandate, and executes the Razorpay transfer via Linked Accounts.
  `,
  merchant: `
# Merchant SDK Integration

The \`@autocart/sdk\` is a drop-in Express router that instantly makes your Node.js backend compatible with AI Buyers.

### 1. Installation

\`\`\`bash
npm install @autocart/sdk
\`\`\`

### 2. Configuration

Initialize the Gateway with your API keys. You must provide a \`fetchProduct\` callback so the SDK can look up the true price of the item from your database before signing the payload.

\`\`\`javascript
import express from 'express';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();

const autocart = new AutoCartGateway({
    merchantKey: process.env.AUTOCART_MERCHANT_KEY,
    merchantSecret: process.env.AUTOCART_MERCHANT_SECRET,
    
    // The SDK calls this to verify the price of the SKU before generating the cryptographic signature
    fetchProduct: async (sku) => {
        const product = await myDatabase.products.findOne({ sku });
        return product; // Must return an object with { price: Number }
    }
});

// Expose the route for AI Agents
app.use('/api/autocart', autocart.createRouter());

app.listen(3000);
\`\`\`

### 3. Webhook Security (Crucial)

When an AI successfully purchases an item, Auto-Cart will fire a webhook to your server so you can fulfill the order.
You MUST validate the \`x-razorpay-signature\` to ensure the request is authentically from us.
  `,
  buyer: `
# Buyer AI Plugin (\`@autocart/ai-tools\`)

If you are building an AI Agent (using LangChain, OpenAI, etc.), you can easily give it the ability to buy products from the Auto-Cart network.

### 1. Installation

\`\`\`bash
npm install @autocart/ai-tools
\`\`\`

### 2. LangChain Integration

The AI tools package exposes pre-built tools that you can directly inject into a ReAct agent.

\`\`\`javascript
import { AutoCartBuyerTool } from '@autocart/ai-tools';
import { createReactAgent } from '@langchain/core';

// Initialize with your Buyer Key
const autocart = new AutoCartBuyerTool({
    buyerKey: process.env.AUTOCART_BUYER_KEY
});

// Create your agent
const agent = createReactAgent({
    llm: myLLM,
    tools: [
        autocart.searchCatalogTool(),
        autocart.checkoutTool()
    ]
});

// Tell your agent to buy something!
const response = await agent.invoke({
    messages: ["Find a Snitch oversized black t-shirt and buy 2 of them."]
});
\`\`\`

### 3. Firewall Mandates

If your Agent attempts to buy something that exceeds your configured **Daily Budget Limit**, the SDK will instantly halt the transaction and ping your WhatsApp for a 1-Click Approval.
  `
};

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', title: 'Overview', icon: Book },
    { id: 'merchant', title: 'Merchant SDK', icon: Terminal },
    { id: 'buyer', title: 'Buyer AI Plugin', icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-card flex items-center px-6 justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-lg tracking-tight text-foreground flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            Auto-Cart Docs
          </Link>
          <div className="h-6 w-px bg-border mx-2"></div>
          <span className="text-sm font-medium text-muted-foreground">API Reference & SDKs</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Developer Dashboard
          </Link>
          <a href="https://github.com/autocart/sdk" target="_blank" rel="noreferrer" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors">
            View on GitHub
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 overflow-y-auto shrink-0 p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Documentation</div>
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600/10 text-blue-500' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.title}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2 mt-8">API Reference</div>
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-sm text-muted-foreground/70 cursor-not-allowed flex justify-between items-center">
              POST /api/webhooks <span className="text-[10px] bg-border px-1.5 rounded text-muted-foreground">Soon</span>
            </div>
            <div className="px-3 py-1.5 text-sm text-muted-foreground/70 cursor-not-allowed flex justify-between items-center">
              GET /api/catalog <span className="text-[10px] bg-border px-1.5 rounded text-muted-foreground">Soon</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-invert prose-blue max-w-none prose-headings:tracking-tight prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border/50">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {docsContent[activeTab]}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
