# autocart-sdk

The official Merchant SDK for the **AutoCart AI Shopping Network**. 

Turn any standard Node.js/Express store into an AI-shoppable storefront in exactly 3 steps. The SDK automatically handles Razorpay checkout intents, cryptographic 3-tier firewall security, and AI agent catalog syncing.

## Installation

```bash
npm install autocart-sdk
```

## Quick Start

Integrate AutoCart into your existing Express server by simply telling the SDK how to read your database.

```javascript
import express from 'express';
import { AutoCartGateway } from 'autocart-sdk';
import { Product } from './models/Product.js'; // Your database model

const app = express();

// 1. Initialize the Gateway
const autocart = new AutoCartGateway({
  merchantKey: process.env.AUTOCART_MERCHANT_KEY,
  merchantSecret: process.env.AUTOCART_MERCHANT_SECRET,
  nexusUrl: 'http://localhost:5000',
  
  // 2. Tell AutoCart how to read your database
  fetchCatalog: async () => await Product.find({}),
  fetchProduct: async (sku) => await Product.findOne({ sku })
});

// 3. Mount the secure AI endpoints
app.use('/autocart', autocart.createRouter());

// Start your server and sync to the AI network!
app.listen(4000, async () => {
    console.log("Server is running!");
    
    // Announce your products to the global AI network
    const products = await Product.find({});
    await fetch('http://localhost:5000/api/engine/sync', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-merchant-key': process.env.AUTOCART_MERCHANT_KEY
      },
      body: JSON.stringify({ products })
    });
});
```

## How It Works

Once mounted, the SDK automatically exposes two secure endpoints to the AutoCart Network:

1. **`GET /autocart/catalog`** - Allows AI Agents to dynamically browse your real-time inventory and stock levels.
2. **`POST /autocart/checkout`** - A cryptographic firewall that intercepts AI purchase attempts, signs the intent with your `merchantSecret`, and safely processes the payment via the central Trust Engine.

## Configuration Options

| Option | Description | Required |
|--------|-------------|----------|
| `merchantKey` | Your public AutoCart merchant ID | Yes |
| `merchantSecret` | Your private cryptographic secret | Yes |
| `fetchProduct(sku)` | Function returning a single product object containing `{ name, price, stock, sku }` | Yes |
| `fetchCatalog()` | Function returning an array of all products for catalog syncing | Yes |
