import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autocart');
    console.log('Connected to DB');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Upsert Dummy Merchant (update if exists, insert if it doesn't)
    const merchant = await User.findOneAndUpdate(
      { email: 'merchant@autocart.com' },
      {
        passwordHash,
        role: 'MERCHANT',
        merchantConfig: {
          merchantKey: 'merch_test_123',
          merchantSecret: 'super_secret_key_999',
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
          firewallRules: { autoApproveUnder: 500, require2FAOver: 5000 }
        }
      },
      { new: true, upsert: true }
    );

    // Upsert Dummy Buyer
    const buyer = await User.findOneAndUpdate(
      { email: 'buyer@autocart.com' },
      {
        passwordHash,
        role: 'BUYER',
        buyerConfig: {
          buyerKey: 'agentkey_demo_alpha',
          dailyBudgetLimit: 50000,
          spentToday: 0,
          shippingProfiles: [
            {
              id: 'ship_01',
              addressLine1: '123 Tech Park',
              city: 'Bangalore',
              state: 'Karnataka',
              postalCode: '560001',
              country: 'India'
            }
          ]
        },
      },
      { new: true, upsert: true }
    );

    console.log('Successfully seeded (or updated) test accounts without affecting real users!');
    console.log('--------------------------------------------------');
    console.log(`Merchant Key: ${merchant.merchantConfig.merchantKey}`);
    console.log(`Merchant Secret: ${merchant.merchantConfig.merchantSecret}`);
    console.log(`Buyer ID: ${buyer.userId}`);
    console.log(`Buyer Key: ${buyer.buyerConfig.buyerKey}`);
    console.log('--------------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
