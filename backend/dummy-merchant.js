import express from 'express';
import cors from 'cors';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();
app.use(cors());

// Dummy Merchant Database
const myDatabase = [
  { sku: 'kb-01', name: 'Ergonomic Mechanical Keyboard', price: 4500, stock: 15, description: 'Long text...' },
  { sku: 'mon-4k', name: '27-inch 4K Monitor', price: 24000, stock: 5, description: 'Long text...' }
];

// Initialize the SDK
const autocart = new AutoCartGateway({
  merchantKey: 'merch_test_123',
  merchantSecret: 'super_secret_key_999',
  fetchCatalog: async () => {
    // In real life, this would be a DB query
    return myDatabase;
  }
});

// Mount the SDK
app.use('/api/ai-store', autocart.createRouter());

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`[Merchant Server] Dummy store running on http://localhost:${PORT}`);
  console.log(`[Merchant Server] AI Catalog exposed at http://localhost:${PORT}/api/ai-store/catalog`);
});
