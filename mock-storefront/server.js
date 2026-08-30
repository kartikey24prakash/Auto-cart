import express from 'express';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();
const PORT = 4000;

// The live keys provided by the user!
const MERCHANT_KEY = 'merch_1d240d691b49434d851e3a16f6b33d9d';
const MERCHANT_SECRET = 'sec_c85c533d2ab04a0f9baacc05ae3b373f';

// Acme Corp's private internal database
const ACME_DB = [
    { sku: 'acme-black-tee', name: 'Acme Heavyweight Black T-Shirt', price: 999, stock: 50, category: 'Apparel' },
    { sku: 'acme-denim-jeans', name: 'Acme Relaxed Fit Denim', price: 1499, stock: 20, category: 'Apparel' },
    { sku: 'acme-jacket-01', name: 'Acme Premium Leather Jacket', price: 2999, stock: 10, category: 'Apparel' },
    { sku: 'acme-socks-01', name: 'Acme Crew Socks (Pack of 3)', price: 399, stock: 100, category: 'Accessories' }
];

// 1. Initialize the SDK
const autocart = new AutoCartGateway({
    merchantKey: MERCHANT_KEY,
    merchantSecret: MERCHANT_SECRET,
    // Provide a callback so the SDK can look up prices directly from Acme's DB
    fetchProduct: async (sku) => {
        return ACME_DB.find(p => p.sku === sku) || null;
    }
});

// 2. Expose the SDK routes so Buyer AIs can hit /autocart/checkout
app.use('/autocart', autocart.createRouter());

app.get('/', (req, res) => {
    res.send('<h1>Acme Corp Server is running!</h1><p>Our catalog is synced to Auto-Cart.</p>');
});

app.listen(PORT, async () => {
    console.log(`[Acme Corp] Storefront running on http://localhost:${PORT}`);
    
    // 3. Sync Catalog to Auto-Cart on startup!
    try {
        console.log(`[Acme Corp] Syncing catalog to Auto-Cart Network...`);
        const response = await fetch('http://localhost:5000/api/engine/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-merchant-key': MERCHANT_KEY
            },
            body: JSON.stringify({ products: ACME_DB })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log(`[Acme Corp] Catalog successfully synced to Auto-Cart! Buyer AIs can now find our products.`);
        } else {
            console.error(`[Acme Corp] Catalog sync failed:`, data.error);
        }
    } catch (err) {
        console.error(`[Acme Corp] Catalog sync error:`, err.message);
    }
});
