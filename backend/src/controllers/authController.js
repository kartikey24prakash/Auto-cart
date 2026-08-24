import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    if (!['BUYER', 'MERCHANT'].includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate unique keys based on role
    let buyerConfig = undefined;
    let merchantConfig = undefined;
    
    if (role.toUpperCase() === 'MERCHANT') {
      merchantConfig = {
        merchantKey: `merch_${uuidv4().replace(/-/g, '')}`,
        merchantSecret: `sec_${uuidv4().replace(/-/g, '')}`,
        firewallRules: { autoApproveUnder: 500, require2FAOver: 5000 }
      };
    } else {
      buyerConfig = {
        buyerKey: `buy_${uuidv4().replace(/-/g, '')}`,
        dailyBudgetLimit: 5000,
        spentToday: 0
      };
    }

    const newUser = await User.create({
      email,
      passwordHash,
      role: role.toUpperCase(),
      buyerConfig,
      merchantConfig
    });

    // Generate JWT for dashboard session
    const token = jwt.sign({ userId: newUser.userId, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
        merchantKey: newUser.merchantConfig?.merchantKey,
        buyerKey: newUser.buyerConfig?.buyerKey
      }
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        merchantKey: user.merchantConfig?.merchantKey,
        buyerKey: user.buyerConfig?.buyerKey
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};
