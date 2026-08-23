// src/models/Product.js
// Catalog item. Price is the authoritative source — never trusted from agent payload.

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    aiTags: {
      type: [String],
      default: [],
    },
    // When this product is purchased, the backend looks for upsell accessories
    // in the category named here.
    upsellTargetCategory: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
