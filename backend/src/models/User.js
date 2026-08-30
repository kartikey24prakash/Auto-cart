import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, default: uuidv4, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // In production, use bcrypt
    role: { type: String, enum: ['BUYER', 'MERCHANT'], default: 'BUYER' },
    
    // Config for BUYER role
    buyerConfig: {
      buyerKey: { type: String, unique: true, sparse: true },
      dailyBudgetLimit: { type: Number, default: 50000 },
      approvalEmail: { type: String },
      spentToday: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: null },
      // Tokenized Payment Method for Auto-Billing
      paymentToken: { type: String, default: null },
      isPaymentLinked: { type: Boolean, default: false },
      
      shippingProfiles: [
        {
          id: { type: String, default: uuidv4 },
          fullName: String,
          phone: String,
          addressLine1: String,
          city: String,
          state: String,
          postalCode: String,
          country: String
        }
      ]
    },

    // Config for MERCHANT role
    merchantConfig: {
      merchantName: { type: String, default: null },
      merchantKey: { type: String, unique: true, sparse: true },
      merchantSecret: { type: String }, // Used to verify HMAC SHA256 signatures from the SDK
      razorpayKeyId: { type: String },
      razorpayKeySecret: { type: String },
      // DNS TXT Domain Verification
      webhookUrl: { type: String, default: null },
      webhookDomainStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'FAILED'], default: 'PENDING' },
      webhookVerificationCode: { type: String, default: () => `autocart-verify-${uuidv4()}` },
      // KYC Linked Accounts
      razorpayLinkedAccountId: { type: String, default: null },
      kycStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED'], default: 'UNVERIFIED' },
      // AI Trust Score
      trustScore: { type: Number, default: 100, min: 0, max: 100 },
      
      firewallRules: {
        autoApproveUnder: { type: Number, default: 500 },
        require2FAOver: { type: Number, default: 5000 }
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
