import { User } from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const providedMerchant = req.headers['x-merchant-key'];
  const providedBuyer = req.headers['x-buyer-key'];

  if (!providedMerchant && !providedBuyer) {
    return res.status(401).json({ error: 'Missing authentication headers.' });
  }

  try {
    let user;

    if (providedMerchant) {
      user = await User.findOne({ 'merchantConfig.merchantKey': providedMerchant });
      if (user) req.userRole = 'MERCHANT';
    } else if (providedBuyer) {
      user = await User.findOne({ 'buyerConfig.buyerKey': providedBuyer });
      if (user) req.userRole = 'BUYER';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    // Attach user to request for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
