import twilio from 'twilio';

// Use mock Twilio credentials for the demo if not in environment
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC_MOCK_SID_1234567890';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'MOCK_AUTH_TOKEN';
const twilioClient = twilio(accountSid, authToken);

export const sendApprovalMessage = async (phoneNumber, auditId, amount, sku) => {
  try {
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/buyer/approvals?auditId=${auditId}`;
    
    // In a real production setup, we send an actual WhatsApp message via Twilio API
    console.log(`\n===========================================`);
    console.log(`[Twilio WhatsApp Simulation] Sending OOB Auth...`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: 🚨 Auto-Cart Firewall Alert 🚨`);
    console.log(`Your AI Agent is trying to purchase ${sku} for ₹${amount}.`);
    console.log(`This exceeds your Daily Budget Limit.`);
    console.log(`Approve securely via Magic Link: ${magicLink}`);
    console.log(`===========================================\n`);

    // Only attempt real Twilio send if we have a real environment variable
    if (process.env.TWILIO_ACCOUNT_SID) {
      await twilioClient.messages.create({
        body: `🚨 Auto-Cart Firewall Alert 🚨\nYour AI Agent is trying to purchase ${sku} for ₹${amount}.\nThis exceeds your Daily Budget Limit.\n\nApprove securely via Magic Link: ${magicLink}`,
        from: 'whatsapp:+14155238886', // Twilio Sandbox Number
        to: `whatsapp:${phoneNumber}`
      });
    }
    
    return true;
  } catch (err) {
    console.error('[WhatsApp Service Error]', err);
    return false;
  }
};
