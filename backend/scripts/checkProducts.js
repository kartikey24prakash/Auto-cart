import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocart');
  const products = await Product.find({}).lean();
  console.log(products.map(p => p.name));
  process.exit(0);
}
check();
