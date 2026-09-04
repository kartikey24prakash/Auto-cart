import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from './src/models/Product.js';
import { User } from './src/models/User.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const merchant = await User.findOne({ role: 'MERCHANT' });
  if (!merchant) {
    console.error('No merchant found. Ensure the original seed is run first.');
    process.exit(1);
  }

  const products = [
    {
      sku: 'kb-01',
      name: 'Mechanical Keyboard (Red Switches)',
      description: 'A premium mechanical keyboard with red linear switches.',
      price: 3000,
      stock: 50,
      merchantId: merchant.userId
    },
    {
      sku: 'laptop-pro',
      name: 'MacBook Pro 16-inch',
      description: 'The ultimate pro laptop with M3 Max chip.',
      price: 80000,
      stock: 5,
      merchantId: merchant.userId
    },
    {
      sku: 'tent-01',
      name: 'Waterproof Camping Tent',
      description: '4-person waterproof camping tent, easy setup.',
      price: 4500,
      stock: 12,
      merchantId: merchant.userId
    }
  ];

  for (const p of products) {
    await Product.findOneAndUpdate({ sku: p.sku }, p, { upsert: true, new: true });
  }

  console.log('Products seeded successfully.');
  process.exit(0);
}

seed().catch(console.error);
