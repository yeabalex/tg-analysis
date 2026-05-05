import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    return Response.json({ error: "Missing jobId" }, { status: 400 });
  }

  try {
    const redis = new Redis(process.env.REDIS_URL as string);
    // Attempt to get the job result from Redis
    const resultString = await redis.get(`job:${jobId}`);
    redis.disconnect();
    
    if (resultString) {
      // If we found it, parse it and return completed status
      const data = JSON.parse(resultString);
      return Response.json({ status: "completed", data: data });
    } else {
      // If not found, it is still processing
      return Response.json({ status: "processing" });
    }

  } catch (error) {
    console.error("Redis fetch error:", error);
    return Response.json({ status: "processing" });
  }
}
