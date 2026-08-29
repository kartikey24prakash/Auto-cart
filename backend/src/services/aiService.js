import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as z from "zod";
import crypto from "crypto";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

const mistralModel = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY
});

const searchCatalogTool = tool(
    async ({ query }) => {
        try {
            let rawResults = [];
            
            // If the user asks for "all", "everything", or generic items, just return everything
            if (!query || query.toLowerCase() === 'all' || query.toLowerCase() === 'items' || query.toLowerCase() === 'everything') {
                rawResults = await Product.find({}).limit(10).lean();
            } else {
                rawResults = await Product.find({ $text: { $search: query } }).limit(10).lean();
                if (rawResults.length === 0) {
                    rawResults = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10).lean();
                }
            }

            // KYC & Trust Score Filtering
            const enrichedResults = [];
            for (const p of rawResults) {
                const merchant = await User.findOne({ userId: p.merchantId }).lean();
                if (!merchant) continue;
                
                // KYC Blocking: Ignore merchants without a verified Razorpay Linked Account
                if (merchant.merchantConfig.kycStatus !== 'VERIFIED' && !merchant.merchantConfig.razorpayLinkedAccountId) {
                    continue; // Skip scammer/unverified products
                }

                enrichedResults.push({
                    ...p,
                    merchantTrustScore: merchant.merchantConfig.trustScore || 100
                });
            }

            // Sort by Trust Score descending
            enrichedResults.sort((a, b) => b.merchantTrustScore - a.merchantTrustScore);

            return JSON.stringify(enrichedResults.slice(0, 5));
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    },
    {
        name: "search_catalog",
        description: "Searches the global Auto-Cart database for products based on a query.",
        schema: z.object({
            query: z.string().describe("The search query (e.g. keyboard, laptop, tent)")
        })
    }
);

import { AuditLog } from "../models/AuditLog.js";

// ... existing code down to class AiService ...

const uploadProductTool = tool(
    async ({ name, price, stock, category, merchantId }) => {
        try {
            const sku = `sku-${Math.random().toString(36).substring(2, 8)}`;
            const product = await Product.create({
                name,
                price,
                stock,
                category: category || 'General',
                sku,
                merchantId
            });
            return JSON.stringify({ success: true, product });
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    },
    {
        name: "upload_product",
        description: "Uploads a new product to the Auto-Cart catalog.",
        schema: z.object({
            name: z.string(),
            price: z.number(),
            stock: z.number(),
            category: z.string().optional(),
            merchantId: z.string()
        })
    }
);

const updateInventoryTool = tool(
    async ({ sku, price, stock, merchantId }) => {
        try {
            const update = {};
            if (price !== undefined) update.price = price;
            if (stock !== undefined) update.stock = stock;
            
            const product = await Product.findOneAndUpdate(
                { sku, merchantId }, 
                update, 
                { new: true }
            );
            if (!product) return JSON.stringify({ error: 'Product not found or not owned by you.' });
            return JSON.stringify({ success: true, product });
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    },
    {
        name: "update_inventory",
        description: "Updates the price or stock of an existing product.",
        schema: z.object({
            sku: z.string(),
            price: z.number().optional(),
            stock: z.number().optional(),
            merchantId: z.string()
        })
    }
);

const viewCatalogTool = tool(
    async ({ merchantId }) => {
        try {
            const products = await Product.find({ merchantId }).lean();
            return JSON.stringify(products);
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    },
    {
        name: "view_catalog",
        description: "Fetches all products currently owned by the merchant.",
        schema: z.object({
            merchantId: z.string()
        })
    }
);

const analyzeSalesTool = tool(
    async ({ merchantId }) => {
        try {
            const logs = await AuditLog.find({ merchantId }).lean();
            const totalOrders = logs.length;
            const totalRevenue = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
            return JSON.stringify({ totalOrders, totalRevenue, recentSales: logs.slice(-5) });
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    },
    {
        name: "analyze_sales",
        description: "Analyzes the merchant's sales and order history.",
        schema: z.object({
            merchantId: z.string()
        })
    }
);

export class AiService {
  async executeCheckout(args, buyerKey) {
    const { sku, qty, merchantId } = args;
    const product = await Product.findOne({ sku });
    if (!product) return JSON.stringify({ error: 'Product not found' });
    
    const merchant = await User.findOne({ userId: merchantId, role: 'MERCHANT' });
    if (!merchant) return JSON.stringify({ error: 'Merchant not found' });

    // OPTION A: If the merchant has an external storefront URL (like our mock-storefront),
    // route the checkout intent directly to THEIR server so they can verify price and sign it!
    const storefrontUrl = merchant.merchantConfig.storefrontUrl;
    
    if (storefrontUrl) {
      try {
        console.log(`[Buyer AI] Routing checkout to external storefront: ${storefrontUrl}`);
        const res = await fetch(storefrontUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-buyer-key': buyerKey },
          body: JSON.stringify({
            sku,
            qty,
            idempotencyKey: crypto.randomUUID(),
            maxAuthorizedAmount: 5000
          })
        });
        const data = await res.json();
        return JSON.stringify(data);
      } catch (err) {
        return JSON.stringify({ error: `External Storefront Error: ${err.message}` });
      }
    }

    // LEGACY FALLBACK: If they don't have a storefront URL, the Gateway signs it on their behalf (Internal checkout)
    const payload = {
      merchantKey: merchant.merchantConfig.merchantKey,
      buyerKey: buyerKey,
      sku: sku,
      qty: qty,
      lineTotal: product.price * qty,
      idempotencyKey: crypto.randomUUID(),
      maxAuthorizedAmount: 100000 // Increased so backend evaluates the actual user budget limits
    };

    const signature = crypto.createHmac('sha256', merchant.merchantConfig.merchantSecret).update(JSON.stringify(payload)).digest('hex');

    try {
      const PORT = process.env.PORT || 5000;
      const res = await fetch(`http://localhost:${PORT}/api/engine/verify-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-autocart-signature': signature },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return JSON.stringify(data);
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  }

  async generateResponse(history, userMessage, buyerKey) {
    const autocartCheckoutTool = tool(
      async (args) => {
          return await this.executeCheckout(args, buyerKey);
      },
      {
          name: "autocart_checkout",
          description: "Executes a secure checkout through the Auto-Cart Trust Engine. Use this when the user says to buy a specific SKU.",
          schema: z.object({
              sku: z.string().describe("The SKU to purchase"),
              qty: z.number().describe("Quantity"),
              merchantId: z.string().describe("The merchant ID from the catalog search")
          })
      }
    );

    const agent = createReactAgent({
        llm: mistralModel,
        tools: [searchCatalogTool, autocartCheckoutTool],
    });

    const messages = [
        new SystemMessage(`You are the Auto-Cart AI shopping assistant. 
        You can search the global product catalog using search_catalog.
        If the user wants to buy something, find the SKU and Merchant ID, then use autocart_checkout to buy it.
        IMPORTANT: If a checkout returns a BLOCKED status due to budget limits, explain this gracefully to the user.`),
        ...history.map(m => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'ai') return new AIMessage(m.content);
            return null;
        }).filter(Boolean),
        new HumanMessage(userMessage)
    ];

    const response = await agent.invoke({ messages });
    const finalMessage = response.messages[response.messages.length - 1];
    return finalMessage.content;
  }

  async generateMerchantResponse(history, userMessage, merchantId) {
    // We bind the merchantId internally so the AI doesn't have to guess it,
    // but the tools are defined globally, so we wrap them to automatically inject merchantId.
    const boundUploadProduct = tool(
        async (args) => uploadProductTool.invoke({ ...args, merchantId }),
        { name: "upload_product", description: uploadProductTool.description, schema: uploadProductTool.schema.omit({ merchantId: true }) }
    );
    
    const boundUpdateInventory = tool(
        async (args) => updateInventoryTool.invoke({ ...args, merchantId }),
        { name: "update_inventory", description: updateInventoryTool.description, schema: updateInventoryTool.schema.omit({ merchantId: true }) }
    );
    
    const boundViewCatalog = tool(
        async () => viewCatalogTool.invoke({ merchantId }),
        { name: "view_catalog", description: viewCatalogTool.description, schema: z.object({}) }
    );
    
    const boundAnalyzeSales = tool(
        async () => analyzeSalesTool.invoke({ merchantId }),
        { name: "analyze_sales", description: analyzeSalesTool.description, schema: z.object({}) }
    );

    const agent = createReactAgent({
        llm: mistralModel,
        tools: [boundUploadProduct, boundUpdateInventory, boundViewCatalog, boundAnalyzeSales],
    });

    const messages = [
        new SystemMessage(`You are the Auto-Cart AI Merchant Assistant. 
        You help the merchant manage their store. You can upload products, update inventory, view their catalog, and analyze sales.
        If you upload or update a product, summarize the action for the user. Do not include raw JSON.
        Format catalogs in neat markdown tables.`),
        ...history.map(m => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'ai') return new AIMessage(m.content);
            return null;
        }).filter(Boolean),
        new HumanMessage(userMessage)
    ];

    const response = await agent.invoke({ messages });
    const finalMessage = response.messages[response.messages.length - 1];
    return finalMessage.content;
  }
}

export const aiService = new AiService();
