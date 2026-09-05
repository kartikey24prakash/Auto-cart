import mongoose from 'mongoose';
import { Product } from './models/Product.js';

// Use the MongoDB Atlas cluster from your main project, but with a new database 'fake_store_db'
const MONGO_URI = 'mongodb+srv://bhaiyazi58_db_user:skywLx16tQAznJ9z@mee.yhzlqhu.mongodb.net/fake_store_db';

const adjectives = ['Premium', 'Wireless', 'Smart', 'Ergonomic', 'Portable', 'Classic', 'Modern', 'Eco-friendly', 'Heavy-Duty', 'Compact', 'Ultralight', 'Advanced', 'Vintage', 'Minimalist', 'Luxury'];
const nouns = ['Headphones', 'Speaker', 'Monitor', 'Keyboard', 'Mouse', 'Jacket', 'Backpack', 'Watch', 'Desk', 'Chair', 'Water Bottle', 'Tablet', 'Laptop Stand', 'Camera', 'Microphone'];
const categories = ['Electronics', 'Apparel', 'Accessories', 'Home & Office', 'Outdoor'];

const generateRandomProduct = (index) => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    name: `${adj} ${noun}`,
    sku: `SKU-${Date.now().toString().slice(-6)}-${index}-${Math.floor(Math.random() * 1000)}`,
    price: Math.floor(Math.random() * 5000) + 199, // Price between 199 and 5198
    stock: Math.floor(Math.random() * 200) + 10,   // Stock between 10 and 209
    category: category,
    description: `This is a highly rated ${adj.toLowerCase()} ${noun.toLowerCase()} from our ${category} collection.`
  };
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products to avoid duplicates if run multiple times
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    // 1. Add specific requested products
    const productsToInsert = [
      {
        name: "Premium Black Cotton Shirt",
        sku: `SKU-SHIRT-101`,
        price: 1999,
        stock: 50,
        category: 'Apparel',
        description: `A highly rated premium black cotton shirt. Perfectly tailored.`
      },
      {
        name: "Diet Coke 12-Pack",
        sku: `SKU-COKE-202`,
        price: 450,
        stock: 120,
        category: 'Groceries',
        description: `Crisp, refreshing Diet Coke in a convenient 12-pack for your fridge.`
      },
      {
        name: "Smart Kitchen Blender",
        sku: `SKU-BLEND-303`,
        price: 3499,
        stock: 15,
        category: 'Household',
        description: `A powerful smart blender for making smoothies and soups.`
      },
      {
        name: "Ceramic Coffee Mug",
        sku: `SKU-MUG-404`,
        price: 299,
        stock: 200,
        category: 'Household',
        description: `A classic minimalist ceramic coffee mug for your morning brew.`
      },
      {
        name: "Dyson Vacuum Cleaner",
        sku: `SKU-VAC-505`,
        price: 4999,
        stock: 5,
        category: 'Household',
        description: `High-suction cordless vacuum cleaner for household cleaning.`
      }
    ];

    // 2. Fill the rest with random items to make the store look full
    for (let i = 1; i <= 20; i++) {
      productsToInsert.push(generateRandomProduct(i));
    }

    await Product.insertMany(productsToInsert);
    console.log(`🚀 Successfully seeded ${productsToInsert.length} products into the database!`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
