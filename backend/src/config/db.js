// src/config/db.js
// Mongoose connection with IST timezone set at process level (see .env TZ=Asia/Kolkata)

import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/safeagent_gateway';

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 no longer needs useNewUrlParser / useUnifiedTopology
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
};
