import { timingSafeEqual } from 'crypto';

export const authMiddleware = (req, res, next) => {
  const merchantSecret = process.env.MERCHANT_SHARED_SECRET;
  const buyerSecret = process.env.AGENT_DEMO_KEY;

  if (!merchantSecret || !buyerSecret) {
    console.error('[AUTH] Missing secrets in .env');
    return res.status(503).json({ error: 'Server misconfiguration.' });
  }

  const providedMerchant = req.headers['x-merchant-key'];
  const providedBuyer = req.headers['x-buyer-key'];

  if (!providedMerchant && !providedBuyer) {
    return res.status(401).json({ error: 'Missing authentication headers.' });
  }

  let match = false;
  try {
    if (providedMerchant) {
      const a = Buffer.from(providedMerchant);
      const b = Buffer.from(merchantSecret);
      match = a.length === b.length && timingSafeEqual(a, b);
      if (match) req.userRole = 'MERCHANT';
    } else if (providedBuyer) {
      const a = Buffer.from(providedBuyer);
      const b = Buffer.from(buyerSecret);
      match = a.length === b.length && timingSafeEqual(a, b);
      if (match) req.userRole = 'BUYER';
    }
  } catch {
    match = false;
  }

  if (!match) {
    return res.status(401).json({ error: 'Invalid authentication key.' });
  }

  next();
};
