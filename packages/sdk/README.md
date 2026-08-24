# @autocart/sdk

The official Node.js SDK for the AutoCart Agentic Commerce Platform.

This SDK allows you to instantly expose your existing e-commerce inventory to autonomous AI Buyers, while enforcing strict, cryptographic spending policies and risk-tier firewalls to protect your revenue.

## Installation

```bash
npm install @autocart/sdk
```

## Quick Start Integration

You do not need to change your database structure to use AutoCart. You simply provide a `fetchCatalog` adapter function that maps your existing database fields to the standard AutoCart format (`sku`, `name`, `price`, `stock`).

```javascript
import express from 'express';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();

// Initialize the Gateway
const autocart = new AutoCartGateway({
  merchantKey: 'YOUR_MERCHANT_KEY',       // Generated in the AutoCart Portal
  merchantSecret: 'YOUR_MERCHANT_SECRET', // Keep this safe!
  
  // The Adapter Function: Translate your DB format to the AutoCart format
  fetchCatalog: async () => {
    // 1. Fetch data from your specific database (SQL, MongoDB, Shopify, etc.)
    const myRawInventory = await myCustomDatabase.getProducts();
    
    // 2. Map your custom fields to the strict AutoCart schema
    return myRawInventory.map(product => ({
      sku: product.item_id,         // Must be a unique string
      name: product.product_title,  // String
      price: product.price_in_inr,  // Number (e.g., 4500)
      stock: product.inventory_qty, // Number (e.g., 10)
      
      // Optional: Add a short description to help the AI make decisions
      description: product.short_desc 
    }));
  }
});

// Mount the SDK on your Express server
app.use('/api/ai-store', autocart.createRouter());

app.listen(3000, () => {
  console.log('AI-Ready Storefront running on port 3000');
});
```

## How It Works

By mounting `autocart.createRouter()`, the SDK automatically generates two endpoints on your server:

1. **`GET /api/ai-store/catalog`**: A highly optimized, token-lean JSON endpoint that AI Scout Agents query to compare prices and check stock.
2. **`POST /api/ai-store/checkout`**: The Policy Firewall interceptor. When an AI attempts a purchase, this endpoint verifies the price against your live DB, cryptographically signs the payload, and pings the AutoCart Trust Engine to ensure the human buyer has approved the budget.

For support, visit [merchants.autocart.com](https://autocart.com).
