// src/config/razorpay.js
// Instantiates the Razorpay SDK once and exports the singleton.
// Never imported on agent-facing paths — only the checkout approve flow and the
// razorpayClient service touch this.

import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    '[RAZORPAY] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. ' +
    'Order creation will fail unless SIMULATE_GATEWAY_FAILURE=true is used for demos.'
  );
}

export const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
