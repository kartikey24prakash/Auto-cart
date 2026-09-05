import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, default: 'General' },
  description: { type: String }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
