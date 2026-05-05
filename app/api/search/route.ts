import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    
    if (!q || q.trim().length === 0) {
      return Response.json({ results: [] });
    }

    const redis = new Redis(process.env.REDIS_URL as string);
    
    let cursor = '0';
    let keys: string[] = [];
    
    // Scan Redis for matching channel keys
    do {
      const [newCursor, scannedKeys] = await redis.scan(
        cursor, 
        'MATCH', 
        `channel:*${q.toLowerCase().trim()}*`, 
        'COUNT', 
        100
      );
      cursor = newCursor;
      keys.push(...scannedKeys);
    } while (cursor !== '0' && keys.length < 20); // Cap scan early if we found enough

    redis.disconnect();

    // Remove 'channel:' prefix and return up to 10 unique results
    const results = Array.from(new Set(keys.map(k => k.replace('channel:', '')))).slice(0, 10);

    return Response.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "Failed to search" }, { status: 500 });
  }
}
