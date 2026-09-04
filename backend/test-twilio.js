import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+17372212163';
const toPhone = process.env.TWILIO_TO_NUMBER || 'whatsapp:+918574309421';

console.log('Account SID:', accountSid ? 'Loaded' : 'Missing');
console.log('Auth Token:', authToken ? 'Loaded' : 'Missing');
console.log('From:', fromPhone);
console.log('To:', toPhone);

const client = twilio(accountSid, authToken);

async function test() {
  try {
    const msg = await client.messages.create({
      body: `🚨 Test from Auto-Cart! If you see this, the firewall is fully wired up! 🚨`,
      from: fromPhone,
      to: toPhone
    });
    console.log('Success! Message SID:', msg.sid);
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}
test();
