import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

async function run() {
    try {
        console.log("Checking Gemini API Key...");
        const aiModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: process.env.GEMINI_API_KEY
        });
        
        console.log("Sending ping to gemini-1.5-flash...");
        const res = await aiModel.invoke([new HumanMessage("Hello, are you online? Answer with exactly 'Yes, Gemini is online!'")]);
        console.log("\n✅ SUCCESS! Model responded:", res.content);
    } catch (e) {
        console.error("\n❌ ERROR:", e.message);
    }
}
run();
