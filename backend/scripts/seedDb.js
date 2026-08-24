import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autocart');
    console.log('Connected to DB');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Upsert Dummy Merchant (update if exists, insert if it doesn't)
    const merchant = await User.findOneAndUpdate(
      { email: 'merchant@test.com' },
      {
        passwordHash,
        role: 'MERCHANT',
        merchantConfig: {
          merchantKey: 'merch_test_123',
          merchantSecret: 'super_secret_key_999',
          firewallRules: { autoApproveUnder: 500, require2FAOver: 5000 }
        }
      },
      { new: true, upsert: true }
    );

    // Upsert Dummy Buyer
    const buyer = await User.findOneAndUpdate(
      { email: 'buyer@test.com' },
      {
        passwordHash,
        role: 'BUYER',
        buyerConfig: {
          buyerKey: 'agentkey_demo_alpha',
          dailyBudgetLimit: 100000,
          spentToday: 0
        }
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
