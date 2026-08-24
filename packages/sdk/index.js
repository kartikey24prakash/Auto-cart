import express from 'express';
import crypto from 'crypto';

export class AutoCartGateway {
  constructor(config) {
    if (!config.merchantKey || !config.merchantSecret || !config.fetchCatalog) {
      throw new Error('AutoCartGateway requires merchantKey, merchantSecret, and fetchCatalog');
    }
    this.merchantKey = config.merchantKey;
    this.merchantSecret = config.merchantSecret;
    this.fetchCatalog = config.fetchCatalog;
    this.nexusUrl = config.nexusUrl || 'http://localhost:5000';
  }

  _signPayload(payload) {
    return crypto
      .createHmac('sha256', this.merchantSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  createRouter() {
    const router = express.Router();
    router.use(express.json());

    router.get('/catalog', async (req, res) => {
      try {
        const fullCatalog = await this.fetchCatalog();
        const leanCatalog = fullCatalog.map(item => ({
          sku: item.sku,
          n: item.name,
          p: item.price,
          s: item.stock
        }));
        res.json({ catalog: leanCatalog });
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch catalog' });
      }
    });

    router.post('/checkout', async (req, res) => {
      try {
        const { buyerId, sku, qty, idempotencyKey } = req.body;

        if (!buyerId || !sku || !qty || !idempotencyKey) {
          return res.status(400).json({ error: 'Missing required checkout fields' });
        }

        const catalog = await this.fetchCatalog();
        const product = catalog.find(p => p.sku === sku);

        if (!product) {
          return res.status(404).json({ error: 'Product SKU not found in merchant catalog' });
        }
        if (product.stock < qty) {
          return res.status(409).json({ error: 'Insufficient stock' });
        }

        const lineTotal = product.price * qty;

        const enginePayload = {
          merchantKey: this.merchantKey,
          buyerId,
          sku,
          qty,
          lineTotal,
          idempotencyKey
        };

        const signature = this._signPayload(enginePayload);

        const response = await fetch(`${this.nexusUrl}/api/engine/verify-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-autocart-signature': signature
          },
          body: JSON.stringify(enginePayload)
        });

        const engineResult = await response.json();

        if (engineResult.status !== 'AUTO_APPROVED') {
          return res.status(200).json({
            status: engineResult.status,
            message: 'Transaction requires human approval or is blocked.',
            auditId: engineResult.auditId
          });
        }

        const simulatedRazorpayOrderId = `order_sdk_${Date.now()}`;

        await fetch(`${this.nexusUrl}/api/engine/commit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-autocart-signature': this._signPayload({ auditId: engineResult.auditId, razorpayOrderId: simulatedRazorpayOrderId })
          },
          body: JSON.stringify({
            auditId: engineResult.auditId,
            razorpayOrderId: simulatedRazorpayOrderId
          })
        });

        return res.status(200).json({
          status: 'PAYMENT_CAPTURED',
          razorpayOrderId: simulatedRazorpayOrderId,
          auditId: engineResult.auditId,
          receipt: `Paid ${lineTotal} INR`
        });

      } catch (err) {
        console.error('[AutoCart SDK] Checkout Error:', err.message);
        res.status(500).json({ error: 'SDK Checkout processing failed' });
      }
    });

    return router;
  }
}
