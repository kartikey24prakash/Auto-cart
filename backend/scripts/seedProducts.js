import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const merchant = await User.findOne({ email: 'merchant@autocart.com' });
    
    if (!merchant) {
      console.log('Run npm run seed first!');
      process.exit(1);
    }

    await Product.deleteMany({}); // clear old products
    
    await Product.insertMany([
      {
        sku: 'snitch-black-tee',
        name: 'Snitch Premium Black T-Shirt',
        description: 'High-quality cotton t-shirt for developers.',
        price: 1500,
        stock: 500,
        merchantId: merchant.userId,
        isVerified: true,
        tags: ['clothing', 't-shirt', 'snitch']
      },
      {
        sku: 'sony-headphones',
        name: 'Sony WH-1000XM5',
        description: 'Noise cancelling wireless headphones.',
        price: 25000,
        stock: 50,
        merchantId: merchant.userId,
        isVerified: true,
        tags: ['electronics', 'audio', 'headphones']
      }
    ]);
    
    console.log('✅ Added 2 demo products to the global catalog!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seedProducts();
