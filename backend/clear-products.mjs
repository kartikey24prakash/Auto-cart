import mongoose from 'mongoose';

const GATEWAY_URI = 'mongodb+srv://bhaiyazi58_db_user:skywLx16tQAznJ9z@mee.yhzlqhu.mongodb.net/safeagent_gateway';
const FAKESTORE_URI = 'mongodb+srv://bhaiyazi58_db_user:skywLx16tQAznJ9z@mee.yhzlqhu.mongodb.net/fake_store_db';

const schema = new mongoose.Schema({ name: String }, { strict: false });

async function run() {
    try {
        console.log("Connecting to Fake Store DB...");
        const conn1 = await mongoose.createConnection(FAKESTORE_URI).asPromise();
        const FakeProduct = conn1.model('Product', schema);
        const fCount = await FakeProduct.countDocuments();
        await FakeProduct.deleteMany({});
        console.log(`Cleared ${fCount} products from fake_store_db.`);
        await conn1.close();

        console.log("Connecting to Gateway DB...");
        const conn2 = await mongoose.createConnection(GATEWAY_URI).asPromise();
        const GatewayProduct = conn2.model('Product', schema);
        const gCount = await GatewayProduct.countDocuments();
        await GatewayProduct.deleteMany({});
        console.log(`Cleared ${gCount} products from safeagent_gateway.`);
        await conn2.close();

        console.log("\n✅ SUCCESS!");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
run();
