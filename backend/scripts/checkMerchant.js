import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocart');
  const merchant = await User.findOne({ email: 'merchant@autocart.com' }).lean();
  console.log(merchant.merchantConfig);
  process.exit(0);
}
check();
