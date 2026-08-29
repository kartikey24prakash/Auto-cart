import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function test() {
  try {
    const msg = await client.messages.create({
      body: `Test SMS from Auto-Cart!`,
      from: '+17372212163', // SMS
      to: '+918574309421'   // SMS
    });
    console.log('Success! SMS SID:', msg.sid);
  } catch (err) {
    console.error('Twilio SMS Error:', err.message);
  }
}
test();
