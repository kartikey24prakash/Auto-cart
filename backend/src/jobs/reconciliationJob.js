import cron from 'node-cron';
import Razorpay from 'razorpay';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';

// The Reconciliation Sweeper
// Runs every hour to check for any orders stuck in "ORDER_CREATED" 
// that might have been paid on Razorpay but the webhook was dropped.
export const startReconciliationJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Starting Hourly Reconciliation Sweeper...');
    try {
      // Find orders created more than 1 hour ago that are still pending
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const stuckLogs = await AuditLog.find({
        status: 'ORDER_CREATED',
        createdAt: { $lt: oneHourAgo },
        razorpayOrderId: { $ne: null }
      });

      if (stuckLogs.length === 0) {
        console.log('[Cron] No stuck transactions found.');
        return;
      }

      console.log(`[Cron] Found ${stuckLogs.length} stuck transactions. Verifying with Razorpay...`);

      for (const log of stuckLogs) {
        try {
          const merchant = await User.findOne({ userId: log.merchantId });
          if (!merchant || !merchant.merchantConfig.razorpayKeyId) continue;

          const rzp = new Razorpay({
            key_id: merchant.merchantConfig.razorpayKeyId,
            key_secret: merchant.merchantConfig.razorpayKeySecret
          });

          // Fetch order details from Razorpay directly
          const order = await rzp.orders.fetch(log.razorpayOrderId);
          
          if (order.status === 'paid') {
            console.log(`[Cron] Order ${log.razorpayOrderId} is PAID on Razorpay but stuck in AutoCart. Reconciling!`);
            
            // Mark as captured
            log.status = 'PAYMENT_CAPTURED';
            
            log.privacyReceipt = {
              timestamp: new Date().toISOString(),
              merchantName: merchant.email,
              total: log.amount,
              gateway: 'Cron Reconciliation'
            };
            await log.save();

            // Deduct from buyer's daily limit since it actually went through
            await User.updateOne({ userId: log.buyerId, role: 'BUYER' }, { $inc: { 'buyerConfig.spentToday': log.amount } });
          } else if (order.status === 'created' || order.status === 'attempted') {
            // It was abandoned or failed
            console.log(`[Cron] Order ${log.razorpayOrderId} abandoned/failed. Marking as FAILED.`);
            log.status = 'FAILED';
            await log.save();
          }
        } catch (err) {
          console.error(`[Cron] Failed to reconcile log ${log.auditId}:`, err.message);
        }
      }
      
      console.log('[Cron] Reconciliation Sweeper finished.');
    } catch (err) {
      console.error('[Cron] Fatal error in Reconciliation Sweeper:', err);
    }
  });
};
