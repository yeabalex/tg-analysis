import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { scrapeTelegramChannel, generatePrompt } from '../utils';

// Create a custom OpenAI instance pointing to Groq's API
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// GET endpoint
export async function GET() {
  return Response.json({ message: "Use POST endpoint with { channelName } to analyze a public channel using Groq Llama 3." });
}

// POST endpoint
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const channelName = body.channelName; 

    if (!channelName) {
      return Response.json({ error: "Please provide a channelName to analyze." }, { status: 400 });
    }

    // 1. Scrape the Telegram Channel (using our refactored shared util)
    const messages = await scrapeTelegramChannel(channelName);
    const recentMessages = messages.slice(-50).join('\n\n');

    console.log(`\n--- [GROQ] SCRAPED ${messages.length} VALID MESSAGES (Sending ${Math.min(messages.length, 50)} to AI) ---`);
    console.log(`--------------------------------------------------\n`);

    if (!recentMessages) {
      return Response.json({ error: "No messages found. Channel might be empty or private." }, { status: 400 });
    }

    // 2. Feed the scraped text to Groq's Llama 3
    // We use generateText to completely bypass the Vercel AI SDK's strict json_schema requirements
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'), 
      prompt: generatePrompt(channelName, recentMessages) + `\n\nCRITICAL INSTRUCTION: You must respond ONLY with a raw, valid JSON object. Do NOT wrap it in markdown \`\`\`json blocks. Do not add any conversational text. 
      
      PERSONALITY INSTRUCTIONS: 
      Be extremely funny, edgy, and creative. Do not give boring or generic answers. Give brutal but hilarious personality assessments.

      The JSON must exactly match this structure:
      {
        "identity": { 
          "devRank": "string (A highly creative, funny, or edgy dev/gamer title. NEVER use boring words like 'beginner' or 'intermediate'. Examples: 'StackOverflow Copy-Paster', 'Vim Elitist', 'Chronically Online Developer')", 
          "activityLevel": "string (e.g., 'Grass Deficient', 'Keyboard Warrior', 'Occasional Poster')" 
        },
        "goodTraits": { "usefulness": number (1-10), "smartness": number (1-10), "positivity": number (1-10), "cool": number (1-10), "funny": number (1-10) },
        "spicyTraits": { "toxicity": number (1-10), "yapLevel": number (1-10), "chaosLevel": number (1-10), "egoLevel": number (1-10), "overconfidence": number (1-10) },
        "personalityType": { "title": "string (A highly creative internet archetype)", "description": "string (Brutal, funny explanation of this archetype)" },
        "strengthsAndWeaknesses": { "strengths": ["string", "string"], "weaknesses": ["string", "string"] },
        "signatureTraits": ["string", "string"],
        "ifTheyWere": {
          "programmingLanguage": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" },
          "framework": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" },
          "footballClub": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" },
          "movieVillain": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" },
          "operatingSystem": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" },
          "webBrowser": { "name": "string", "description": "string (Max 1 funny sentence explaining why)" }
        }
      }`,
    });

    // 3. Parse the JSON manually
    let analysis;
    try {
      const cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse JSON:", result.text);
      return Response.json({ error: "Failed to parse JSON from AI response.", raw: result.text }, { status: 500 });
    }

    return Response.json({
      scrapedMessageCount: messages.length,
      channel: channelName,
      analysis: analysis,
      engine: 'Groq Llama-3.3-70B'
    });
  } catch (error: any) {
    console.error("Analysis failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
