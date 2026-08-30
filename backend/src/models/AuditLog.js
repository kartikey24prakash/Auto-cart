import mongoose from 'mongoose';

const STATUS_VALUES = [
  'PENDING',
  'AUTO_APPROVED',
  'GATED_1_CLICK',
  'GATED_2FA',
  'BLOCKED',
  'DENIED',
  'ORDER_PENDING_CONFIRM',
  'ORDER_CREATED',
  'PAYMENT_CAPTURED',
  'FAILED',
  'GATEWAY_DEGRADED',
];

const auditLogSchema = new mongoose.Schema(
  {
    auditId: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    
    // Core transaction details
    sku: { type: String, required: true },
    productName: { type: String, default: null },
    merchantName: { type: String, default: null },
    qty: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String },
    
    // Fulfillment
    shippingAddress: {
      addressLine1: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },

    // State & Security
    status: { type: String, enum: STATUS_VALUES, required: true, default: 'PENDING' },
    blockReason: { type: String, default: null },
    totpAttempts: { type: Number, default: 0, min: 0 },
    idempotencyKey: { type: String, required: true },

    // Federated Security (HMAC Signature from SDK)
    sdkSignature: { type: String, required: true },

    // Razorpay Integration
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    
    // Privacy Receipt Generation
    privacyReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Idempotency guard per buyer
auditLogSchema.index({ buyerId: 1, idempotencyKey: 1 }, { unique: true });
// Dashboard Scalability Indexes (Phase 5)
auditLogSchema.index({ merchantId: 1, createdAt: -1 });
auditLogSchema.index({ buyerId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export { STATUS_VALUES };
