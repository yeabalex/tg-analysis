import { inngest } from "../../../inngest/client";
import Redis from 'ioredis';

// GET endpoint
export async function GET() {
  return Response.json({ message: "Use POST endpoint with { channelName } to queue a background analysis job." });
}

// POST endpoint
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const channelName = body.channelName; 
    const chatId = body.chatId;

    if (!channelName) {
      return Response.json({ error: "Please provide a channelName to analyze." }, { status: 400 });
    }

    // Connect to Redis to check for cached results (cache keys are case-insensitive)
    const redis = new Redis(process.env.REDIS_URL as string);
    const cachedResult = await redis.get(`channel:${channelName.toLowerCase()}`);
    
    if (cachedResult) {
      console.log(`[CACHE HIT] Returning saved analysis for @${channelName}`);
      redis.disconnect();
      
      // Return the cached data instantly, skipping the background job entirely
      return Response.json({
        message: `Cached analysis found for ${channelName}`,
        status: "completed",
        cached: true,
        data: JSON.parse(cachedResult)
      });
    }
    
    redis.disconnect();

    // Generate a unique ID for this specific analysis job
    const jobId = crypto.randomUUID();

    // Fire off the background job!
    // This returns instantly to the frontend while the heavy scraping + AI work
    // happens securely in the background without timing out Vercel.
    await inngest.send({
      name: "app/analyze.channel",
      data: {
        channelName,
        jobId,
        chatId: chatId || null
      }
    });

    // Immediately return success to the frontend
    return Response.json({
      message: `Background job started for ${channelName}`,
      jobId: jobId,
      status: "processing"
    });

  } catch (error: any) {
    console.error("Failed to start background job:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}