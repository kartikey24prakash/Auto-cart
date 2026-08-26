import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as z from "zod";
import crypto from "crypto";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    apiKey: process.env.GEMINI_API_KEY
});

const searchCatalogTool = tool(
    async ({ query }) => {
        try {
            const products = await Product.find({ $text: { $search: query } }).limit(5).lean();
            if (products.length === 0) {
                const fallback = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(5).lean();
                return JSON.stringify(fallback);
            }
            return JSON.stringify(products);
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

export class AiService {
  async executeCheckout(args, buyerKey) {
    const { sku, qty, merchantId } = args;
    const product = await Product.findOne({ sku });
    if (!product) return JSON.stringify({ error: 'Product not found' });
    
    const merchant = await User.findOne({ userId: merchantId, role: 'MERCHANT' });
    if (!merchant) return JSON.stringify({ error: 'Merchant not found' });

    const payload = {
      merchantKey: merchant.merchantConfig.merchantKey,
      buyerKey: buyerKey,
      sku: sku,
      qty: qty,
      lineTotal: product.price * qty,
      idempotencyKey: crypto.randomUUID(),
      maxAuthorizedAmount: 5000
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
        llm: geminiModel,
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
    
    // LangChain React Agent returns { messages: [ ... ] } where the last message is the AI's final answer
    const finalMessage = response.messages[response.messages.length - 1];
    return finalMessage.content;
  }
}

export const aiService = new AiService();
