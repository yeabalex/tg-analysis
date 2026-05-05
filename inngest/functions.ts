import { inngest } from "./client";
import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { analyzerSchema, scrapeTelegramChannel, generatePrompt } from '../app/api/utils';

// Initialize Groq for the fallback
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const analyzeChannelBackground = inngest.createFunction(
  {
    id: "analyze-telegram-channel",
    retries: 0, 
    onFailure: async ({ error, event }) => {
      const jobId = event.data.event.data.jobId;
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      await redis.set(`job:${jobId}`, JSON.stringify({ error: error.message || "Failed to analyze channel" }), 'EX', 86400);
      redis.disconnect();
    },
    triggers: [{ event: "app/analyze.channel" }]
  },
  async ({ event, step }) => {
    const channelName = event.data.channelName;
    const jobId = event.data.jobId;

    // Step 1: Scrape Telegram
    const messages = await step.run("scrape-telegram", async () => {
      console.log(`[JOB ${jobId}] Scraping Telegram for @${channelName}...`);
      const msgs = await scrapeTelegramChannel(channelName);
      if (!msgs || msgs.length === 0) {
        throw new Error("No messages found. Channel might be empty or private.");
      }
      return msgs;
    });

    const recentMessages = messages.slice(-50).join('\n\n');

    let analysis;
    let engine;

    // Step 2: Try Gemini (Plan A)
    try {
      const geminiResult = await step.run("analyze-with-gemini", async () => {
        console.log(`[JOB ${jobId}] Attempting Plan A: Gemini 2.5 Flash...`);
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: analyzerSchema,
          prompt: generatePrompt(channelName, recentMessages),
        });
        return result.object;
      });
      analysis = geminiResult;
      engine = 'Gemini 2.5 Flash';

    } catch (err) {
      // Step 3: Fallback to Groq (Plan B)
      console.log(`[JOB ${jobId}] Gemini failed. Falling back to Plan B: Groq Llama 3.3...`);

      const groqResultText = await step.run("analyze-with-groq", async () => {
        const groqResult = await generateText({
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
            "goodTraits": { 
              "usefulness": { "score": number (1-100), "description": "string" },
              "smartness": { "score": number (1-100), "description": "string" },
              "positivity": { "score": number (1-100), "description": "string" },
              "cool": { "score": number (1-100), "description": "string" },
              "funny": { "score": number (1-100), "description": "string" },
              "basedLevel": { "score": number (1-100), "description": "string" },
              "aura": { "score": number (1-100), "description": "string" }
            },
            "spicyTraits": { 
              "toxicity": { "score": number (1-100), "description": "string" },
              "yapLevel": { "score": number (1-100), "description": "string" },
              "chaosLevel": { "score": number (1-100), "description": "string" },
              "egoLevel": { "score": number (1-100), "description": "string" },
              "overconfidence": { "score": number (1-100), "description": "string" },
              "brainrotLevel": { "score": number (1-100), "description": "string" },
              "delusionLevel": { "score": number (1-100), "description": "string" }
            },
            "personalityType": { "title": "string (A highly creative internet archetype)", "description": "string (Brutal, funny explanation of this archetype)" },
            "strengthsAndWeaknesses": { "strengths": ["string", "string"], "weaknesses": ["string", "string"] },
            "mostLikelyTo": "string (A high-school yearbook style superlative)",
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
        return groqResult.text;
      });

      const cleanText = groqResultText.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleanText);
      engine = 'Groq Llama-3.3-70B (Fallback)';
    }

    // Step 4: Save to Database / Output
    await step.run("save-results", async () => {
      console.log(`\n======================================================`);
      console.log(`✅ [JOB ${jobId}] FINISHED ANALYZING @${channelName}!`);
      console.log(`   Engine used: ${engine}`);
      console.log(`======================================================\n`);

      // Save result to Redis!
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);

      const payload = {
        channel: channelName,
        analysis: analysis,
        engine: engine,
        completedAt: new Date().toISOString()
      };

      // Save to Redis and set it to expire in 24 hours (86400 seconds) so it doesn't clutter forever
      // We save TWO keys: one for the specific job, and one for the channel caching
      await redis.set(`job:${jobId}`, JSON.stringify(payload), 'EX', 86400);
      await redis.set(`channel:${channelName.toLowerCase()}`, JSON.stringify(payload), 'EX', 86400);

      // Disconnect cleanly
      redis.disconnect();
    });

    return { success: true, channel: channelName, engine };
  }
);
