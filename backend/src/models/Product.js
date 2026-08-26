import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  }
}, { timestamps: true });

// Text index to allow the AI to search products via keywords
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
