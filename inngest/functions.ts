import { inngest } from "./client";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { analyzerSchema, scrapeTelegramChannel, generatePrompt } from '../app/api/utils';

export const analyzeChannelBackground = inngest.createFunction(
  {
    id: "analyze-telegram-channel",
    retries: 0, 
    onFailure: async ({ error, event }) => {
      const jobId = event.data.event.data.jobId;
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      await redis.set(`job:${jobId}`, JSON.stringify({ error: error.message || "Failed to analyze channel" }));
      redis.disconnect();
    },
    triggers: [{ event: "app/analyze.channel" }]
  },
  async ({ event, step }) => {
    const channelName = event.data.channelName;
    const jobId = event.data.jobId;
    const chatId = event.data.chatId;

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

    // Step 2: Check if Gemini is on a 30-minute cooldown
    const isGeminiRateLimited = await step.run("check-gemini-cooldown", async () => {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      const isLimited = await redis.get('gemini:rate_limited');
      redis.disconnect();
      return !!isLimited;
    });

    if (!isGeminiRateLimited) {
      try {
        const geminiResult = await step.run("analyze-with-gemini", async () => {
          console.log(`[JOB ${jobId}] Attempting Plan A: Gemini 2.5 Flash...`);
          
          // Round-robin (random) selection for Gemini keys
          const keysStr = process.env.GOOGLE_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
          const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
          const selectedKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : undefined;
          
          const google = createGoogleGenerativeAI({ apiKey: selectedKey });

          try {
            const result = await generateObject({
              model: google('gemini-2.5-flash'),
              schema: analyzerSchema,
              prompt: generatePrompt(channelName, recentMessages),
            });
            return result.object;
          } catch (error: any) {
            console.error(`[JOB ${jobId}] Gemini Error:`, error.message);
            // If it's a rate limit error (429), set a 30-minute cooldown in Redis
            if (error.statusCode === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('rate') || error.message?.toLowerCase().includes('exhausted')) {
              console.log(`[JOB ${jobId}] ⚠️ Gemini rate limit hit! Setting 30-minute cooldown...`);
              const Redis = require('ioredis');
              const redis = new Redis(process.env.REDIS_URL);
              await redis.set('gemini:rate_limited', 'true', 'EX', 1800);
              redis.disconnect();
            }
            throw error; // Let Inngest catch it and trigger Plan B
          }
        });
        analysis = geminiResult;
        engine = 'Gemini 2.5 Flash';

      } catch (err) {
        console.log(`[JOB ${jobId}] Gemini failed. Falling back to Plan B: Groq Llama 3.3...`);
      }
    } else {
      console.log(`[JOB ${jobId}] 🛑 Gemini is currently on a 30-minute cooldown. Skipping straight to Groq...`);
    }

    if (!analysis) {
      // Step 3: Fallback to Groq (Plan B)
      const groqResultText = await step.run("analyze-with-groq", async () => {
        // Round-robin (random) selection for Groq keys
        const keysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
        const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
        const selectedKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : undefined;
        
        const groq = createOpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: selectedKey,
        });

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

      // Save permanently — one key for the specific job, one for the channel cache
      await redis.set(`job:${jobId}`, JSON.stringify(payload));
      await redis.set(`channel:${channelName.toLowerCase()}`, JSON.stringify(payload));

      // Increment persistent all-time counter for total creators analyzed
      await redis.incr('stats:total_analyzed');

      // Disconnect cleanly
      redis.disconnect();
    });

    // Step 5: Notify user via Telegram Bot
    if (chatId) {
      await step.run("notify-telegram", async () => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          console.log(`[JOB ${jobId}] No bot token set, skipping notification.`);
          return;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tg-analysis.vercel.app';
        const message = `🔥 *Your analysis for @${channelName} is ready!*\n\nTap below to see your personality breakdown 👇`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '📊 View Results', web_app: { url: `${appUrl}?channel=${channelName}` } }
              ]]
            }
          })
        });
        console.log(`[JOB ${jobId}] Telegram notification sent to chat ${chatId}`);
      });
    }

    return { success: true, channel: channelName, engine };
  }
);
