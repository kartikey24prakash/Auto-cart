import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocart');
  
  // Just unlink the card for all buyers so the user can test the manual checkout
  await User.updateMany({ role: 'BUYER' }, { $set: { 'buyerConfig.isPaymentLinked': false, 'buyerConfig.paymentToken': null } });
  
  console.log('Card unlinked successfully!');
  process.exit(0);
}
reset();
