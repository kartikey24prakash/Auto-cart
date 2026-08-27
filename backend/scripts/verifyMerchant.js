import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocart');
  await User.updateMany(
    { role: 'MERCHANT' },
    { $set: { 'merchantConfig.kycStatus': 'VERIFIED', 'merchantConfig.razorpayLinkedAccountId': 'acc_fake_12345' } }
  );
  console.log('All merchants verified!');
  process.exit(0);
}
verify();
