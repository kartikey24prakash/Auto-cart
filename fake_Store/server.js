import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import { Product } from './models/Product.js';
import { AutoCartGateway } from 'autocart-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fake_store_db';

app.use(cors());
app.use(express.json());
app.use('/api/products', productRoutes);

const autocart = new AutoCartGateway({
  merchantKey: 'merch_1d240d691b49434d851e3a16f6b33d9d',
  merchantSecret: 'sec_c85c533d2ab04a0f9baacc05ae3b373f',
  nexusUrl: 'http://localhost:5000',
  
  // 2. Tell AutoCart how to read your database
  fetchCatalog: async () => await Product.find({}),
  fetchProduct: async (sku) => await Product.findOne({ sku })
});

app.use('/autocart', autocart.createRouter());

// Database connection & Server start
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    app.listen(PORT, async () => {
      console.log(`🚀 Fake Store running on http://localhost:${PORT}`);
      
      const products = await Product.find({});
    await fetch('http://localhost:5000/api/engine/sync', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-merchant-key': 'merch_1d240d691b49434d851e3a16f6b33d9d'
      },
      body: JSON.stringify({ products })
    });
     
      
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
