import crypto from 'crypto';

export class AutoCartBuyerTool {
  constructor(config) {
    if (!config.buyerKey) {
      throw new Error('AutoCartBuyerTool requires a buyerKey');
    }
    this.buyerKey = config.buyerKey;
  }

  // Returns the OpenAI Function Calling Schema
  getOpenAISchema() {
    return {
      name: 'autocart_buy_product',
      description: 'Purchases a product from an AutoCart-enabled merchant store.',
      parameters: {
        type: 'object',
        properties: {
          merchantUrl: {
            type: 'string',
            description: 'The base URL of the merchant store (e.g., http://store.com/api/ai-store/checkout)'
          },
          sku: {
            type: 'string',
            description: 'The exact SKU or product ID to purchase'
          },
          qty: {
            type: 'integer',
            description: 'The quantity to purchase (default 1)'
          },
          maxAuthorizedAmount: {
            type: 'number',
            description: 'The maximum total price the AI is willing to pay. Prevents price gouging.'
          }
        },
        required: ['merchantUrl', 'sku']
      }
    };
  }

  // Executes the function
  async execute(args) {
    const { merchantUrl, sku, qty = 1, maxAuthorizedAmount } = args;
    
    // Using a random UUID for idempotency in the tool
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

    const payload = {
      sku,
      qty,
      idempotencyKey,
      maxAuthorizedAmount
    };

    try {
      const response = await fetch(merchantUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-buyer-key': this.buyerKey
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return `Failed to purchase: ${result.error || result.message || JSON.stringify(result)}`;
      }

      if (result.status === 'GATED_1_CLICK' || result.status === 'GATED_2FA') {
        return `Transaction blocked by firewall. Awaiting human approval. Audit ID: ${result.auditId}`;
      }

      if (result.status === 'PAYMENT_CAPTURED') {
        return `Successfully purchased ${qty} of ${sku}. Order ID: ${result.razorpayOrderId}`;
      }

      return `Order status: ${result.status}`;
    } catch (err) {
      return `Error executing AutoCart transaction: ${err.message}`;
    }
  }
}
