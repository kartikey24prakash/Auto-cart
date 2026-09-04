import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/genai'; 

// Wait, the SDK used is @langchain/google-genai, which uses @google/generative-ai under the hood.
import { GoogleGenerativeAI as GAI } from '@google/generative-ai';

async function run() {
    try {
        console.log("Checking available Gemini models...");
        const genAI = new GAI(process.env.GEMINI_API_KEY);
        // The listModels method isn't strictly documented in the basic AI class, let's just fetch it via REST.
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        const models = data.models.map(m => m.name);
        console.log("Available Models:", models);
        
    } catch (e) {
        console.error("\n❌ ERROR:", e.message);
    }
}
run();
