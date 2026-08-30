import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const searchCatalog = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: 'Query required' });

        const products = await Product.find({ $text: { $search: query } }).limit(10).lean();
        let rawResults = products;
        
        if (rawResults.length === 0) {
            rawResults = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10).lean();
        }

        const enrichedResults = [];
        for (const p of rawResults) {
            const merchant = await User.findOne({ userId: p.merchantId }).lean();
            if (!merchant) continue;
            
            // KYC Blocking
            if (merchant.merchantConfig.kycStatus !== 'VERIFIED') {
                continue; 
            }
            
            enrichedResults.push({
                ...p,
                trustScore: merchant.merchantConfig.trustScore,
                merchantName: merchant.merchantConfig?.merchantName || merchant.fullName || 'Verified Merchant',
                merchantUrl: merchant.merchantConfig.webhookUrl || `http://localhost:5000/autocart`
            });
        }

        enrichedResults.sort((a, b) => b.trustScore - a.trustScore);
        res.json({ results: enrichedResults });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
