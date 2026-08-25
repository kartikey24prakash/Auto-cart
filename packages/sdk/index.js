import express from 'express';
import crypto from 'crypto';


export class AutoCartGateway {
  constructor(config) {
    if (!config.merchantKey || !config.merchantSecret || !config.fetchProduct) {
      throw new Error('AutoCartGateway requires merchantKey, merchantSecret, and fetchProduct');
    }
    this.merchantKey = config.merchantKey;
    this.merchantSecret = config.merchantSecret;
    this.fetchCatalog = config.fetchCatalog; // Optional for legacy/indexing
    this.fetchProduct = config.fetchProduct;
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
        if (!this.fetchCatalog) {
          return res.status(501).json({ error: 'Merchant does not support full catalog fetching' });
        }
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
        const { sku, qty, idempotencyKey, maxAuthorizedAmount } = req.body;
        const buyerKey = req.headers['x-buyer-key'];

        if (!buyerKey || !sku || !qty || !idempotencyKey) {
          return res.status(400).json({ error: 'Missing required checkout fields or x-buyer-key header' });
        }

        const product = await this.fetchProduct(sku);

        if (!product) {
          return res.status(404).json({ error: 'Product SKU not found in merchant catalog' });
        }
        if (product.stock < qty) {
          return res.status(409).json({ error: 'Insufficient stock' });
        }

        const lineTotal = product.price * qty;

        const enginePayload = {
          merchantKey: this.merchantKey,
          buyerKey,
          sku,
          qty,
          lineTotal,
          idempotencyKey,
          maxAuthorizedAmount
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

        if (!response.ok) {
          return res.status(response.status).json(engineResult);
        }

        if (engineResult.status !== 'AUTO_APPROVED') {
          return res.status(200).json({
            status: engineResult.status,
            message: 'Transaction requires human approval or is blocked.',
            auditId: engineResult.auditId
          });
        }

        // Simulating the Webhook since headless payments aren't tokenized in this demo
        await fetch(`${this.nexusUrl}/api/webhook/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': 'test-webhook-bypass'
          },
          body: JSON.stringify({
            event: 'payment.captured',
            payload: {
              payment: {
                entity: {
                  id: 'pay_sdk_auto',
                  order_id: engineResult.razorpayOrderId
                }
              }
            }
          })
        });

        return res.status(200).json({
          status: 'PAYMENT_CAPTURED',
          razorpayOrderId: engineResult.razorpayOrderId,
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
