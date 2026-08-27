import { User } from '../models/User.js';
import dns from 'dns';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const resolveTxt = promisify(dns.resolveTxt);

export const getDomainConfig = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    res.json({
      webhookUrl: user.merchantConfig.webhookUrl,
      status: user.merchantConfig.webhookDomainStatus,
      code: user.merchantConfig.webhookVerificationCode
    });
  } catch (err) {
    next(err);
  }
};

export const requestVerification = async (req, res, next) => {
  try {
    const { webhookUrl } = req.body;
    const user = await User.findOne({ userId: req.user.userId });
    
    user.merchantConfig.webhookUrl = webhookUrl;
    user.merchantConfig.webhookDomainStatus = 'PENDING';
    user.merchantConfig.webhookVerificationCode = `autocart-verify-${uuidv4()}`;
    await user.save();
    
    res.json({
      webhookUrl: user.merchantConfig.webhookUrl,
      status: user.merchantConfig.webhookDomainStatus,
      code: user.merchantConfig.webhookVerificationCode
    });
  } catch (err) {
    next(err);
  }
};

export const verifyDomain = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const domainStr = user.merchantConfig.webhookUrl;
    
    if (!domainStr) {
      return res.status(400).json({ error: 'No webhook domain requested.' });
    }

    let hostname = domainStr;
    try {
      if (!hostname.startsWith('http')) {
        hostname = 'https://' + hostname;
      }
      hostname = new URL(hostname).hostname;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid domain format.' });
    }

    const code = user.merchantConfig.webhookVerificationCode;

    try {
      const records = await resolveTxt(hostname);
      // resolveTxt returns an array of arrays: [ ['v=spf1...'], ['autocart-verify-123...'] ]
      const found = records.some(recordArray => recordArray.join('') === code);
      
      if (found) {
        user.merchantConfig.webhookDomainStatus = 'VERIFIED';
        await user.save();
        return res.json({ success: true, status: 'VERIFIED' });
      } else {
        return res.status(400).json({ error: `TXT record not found on ${hostname}. Ensure the record has propagated.` });
      }
    } catch (dnsErr) {
      console.error('DNS Lookup Error:', dnsErr);
      return res.status(400).json({ error: `DNS lookup failed for ${hostname}.` });
    }
    
  } catch (err) {
    next(err);
  }
};
