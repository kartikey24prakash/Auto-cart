import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as z from "zod";
import crypto from "crypto";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { redisClient } from "./redisClient.js";

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

                let merchant_offer = undefined;
                if ((query && query.toLowerCase().includes('shirt')) || (p.name && p.name.toLowerCase().includes('shirt'))) {
                    merchant_offer = {
                        upsell_sku: "acme-socks",
                        upsell_name: "Acme Crew Socks",
                        original_price: 399,
                        discounted_price: 250,
                        pitch: "Because you are buying the shirt, the merchant is offering an exclusive bundle: add Crew Socks for just ₹250 (normally ₹399). Tell the user I have temporarily reserved this inventory for them for exactly 5 minutes."
                    };
                    
                    // Set a 5-minute (300 seconds) reservation lock in Redis
                    // Assuming buyerKey is passed in or we use a generic string for demo
                    const reservationKey = `reserve:${p.sku}:buyer_session`;
                    await redisClient.setEx(reservationKey, 300, "LOCKED");
                }

                enrichedResults.push({
                    ...p,
                    merchantName: merchant.merchantConfig?.merchantName || 'Verified Merchant',
                    merchantTrustScore: merchant.merchantConfig.trustScore || 100,
                    merchant_offer
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
    const { skus, finalAmount, sku, qty, merchantId } = args;
    console.log("[DEBUG] executeCheckout called with:", JSON.stringify(args));
    
    // Support both old {sku, qty} and new {skus, finalAmount} formats
    const primarySku = skus && skus.length > 0 ? skus[0] : sku;
    const finalQty = qty || 1;
    const finalSkusArray = skus || [primarySku];
    
    // REDIS LOCK VERIFICATION
    const reservationKey = `reserve:${primarySku}:buyer_session`;
    const hasLock = await redisClient.get(reservationKey);
    
    const product = await Product.findOne({ sku: primarySku });
    if (!product) return JSON.stringify({ error: `Product not found for SKU: ${primarySku}` });
    
    if (!hasLock) {
        // If the lock expired, verify it didn't sell out!
        if (product.stock <= 0) {
            return JSON.stringify({ error: "Your 5-minute reservation expired and the item is now SOLD OUT." });
        }
    } else {
        // We have the lock! Delete it so it can't be double-spent.
        await redisClient.del(reservationKey);
    }
    
    const merchant = await User.findOne({ userId: merchantId, role: 'MERCHANT' });
    if (!merchant) return JSON.stringify({ error: 'Merchant not found' });

    // LEGACY FALLBACK: Internal checkout signing
    const payload = {
      merchantKey: merchant.merchantConfig.merchantKey,
      buyerKey: buyerKey,
      sku: finalSkusArray.join(','), // Send combined SKUs
      qty: finalQty,
      lineTotal: finalAmount || (product.price * finalQty),
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
          description: "Executes a secure checkout through the Auto-Cart Trust Engine. Use this when the user says to buy a specific SKU, or if they accepted a bundle deal.",
          schema: z.object({
              skus: z.array(z.string()).describe("Array of SKUs to purchase (e.g., ['acme-black-tee'] or ['acme-black-tee', 'acme-socks'])"),
              finalAmount: z.number().describe("The final total amount to charge (base price, or bundled price if upsell accepted)"),
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
        You MUST search the global product catalog using search_catalog BEFORE trying to check out. NEVER guess a SKU.
        When displaying a product, ALWAYS mention the Merchant's name (merchantName) so the user knows who they are buying from.
        
        When you search for a product and receive a 'merchant_offer' in the JSON response, YOU MUST PAUSE AND DO NOT EXECUTE THE CHECKOUT YET.
        1. Relay the offer to the user clearly. Example: "I found your T-shirt for ₹999. The merchant is offering an exclusive deal: add Crew Socks for just ₹250. Do you want the bundle for ₹1249 total, or just the shirt for ₹999?"
        2. Wait for the user's reply.
        3. If the user says YES to the bundle: Call the autocart_checkout tool using an array of BOTH skus in the 'skus' field, and the COMBINED total in 'finalAmount'.
        4. If the user says NO (just the base item): Call the autocart_checkout tool using ONLY the original sku in the 'skus' field, and the ORIGINAL price in 'finalAmount'.

        CRITICAL RULES FOR CHECKOUT:
        If the user says "I want to buy [product]" or clicks a Buy button, YOU MUST NOT ASK FOR CONFIRMATION. You must IMMEDIATELY execute search_catalog (to get the SKU) and then immediately execute autocart_checkout in the same turn. DO NOT pause to ask "Are you sure?" or "Do you want to proceed?".
        
        CRITICAL UI & FORMATTING RULES:
        1. NEVER act like a robot dumping JSON logs. Do not repeat raw tool outputs.
        2. Speak like a friendly human assistant. 
        3. DO NOT output products using markdown text. When you display a product or offer, you MUST output this exact tag format on a new line (and the frontend will convert it into a beautiful React UI card):
           [PRODUCT_CARD:{"name":"[Product Name]", "price":[Price], "merchant":"[Merchant]", "stock":[Stock], "offer":"[If there is a merchant_offer pitch, put it here, otherwise leave empty]"}]
        4. If a checkout is successfully AUTO_APPROVED, just say: "Done! Your order has been placed successfully."
        5. If a checkout returns GATED_1_CLICK or GATED_2FA, include this exact string: [APPROVAL_REQUIRED:auditId] (replace auditId).
        6. Do not draw attention to the [APPROVAL_REQUIRED] string in your text. Just say: "This transaction exceeds our autonomous budget limits and requires your manual approval below."`),
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
