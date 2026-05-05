import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const redis = new Redis(process.env.REDIS_URL as string);
    const keys = await redis.keys('channel:*');
    
    if (keys.length === 0) {
      redis.disconnect();
      return Response.json({ leaderboards: null });
    }

    const rawData = await redis.mget(...keys);
    redis.disconnect();

    const channels = rawData
      .filter((d): d is string => d !== null)
      .map(d => JSON.parse(d));

    // Sort and rank
    const mostToxic = [...channels].sort((a, b) => b.analysis.spicyTraits.toxicity.score - a.analysis.spicyTraits.toxicity.score).slice(0, 10);
    const smartest = [...channels].sort((a, b) => b.analysis.goodTraits.smartness.score - a.analysis.goodTraits.smartness.score).slice(0, 10);
    const mostChaotic = [...channels].sort((a, b) => b.analysis.spicyTraits.chaosLevel.score - a.analysis.spicyTraits.chaosLevel.score).slice(0, 10);
    const highestAura = [...channels].sort((a, b) => (b.analysis.goodTraits?.aura?.score || 0) - (a.analysis.goodTraits?.aura?.score || 0)).slice(0, 10);
    
    const langs: Record<string, { count: number, channels: string[] }> = {};
    const frameworks: Record<string, number> = {};

    for (const c of channels) {
      const lang = c.analysis.ifTheyWere?.programmingLanguage?.name;
      if (lang) {
        if (!langs[lang]) langs[lang] = { count: 0, channels: [] };
        langs[lang].count++;
        langs[lang].channels.push(c.channel);
      }

      const fw = c.analysis.ifTheyWere?.framework?.name;
      if (fw) frameworks[fw] = (frameworks[fw] || 0) + 1;
    }

    const topLanguages = Object.entries(langs).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(e => ({ name: e[0], count: e[1].count, channels: e[1].channels }));
    const topFrameworks = Object.entries(frameworks).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ name: e[0], count: e[1] }));

    // Extract all scores for percentile calculations on the frontend
    const allToxicityScores = channels.map(c => c.analysis.spicyTraits.toxicity.score).sort((a, b) => a - b);
    const allSmartnessScores = channels.map(c => c.analysis.goodTraits.smartness.score).sort((a, b) => a - b);
    
    // Extract raw traits for vibe matching (Euclidean distance)
    const rawChannels = channels.map(c => ({
      channel: c.channel,
      traits: {
        smartness: c.analysis.goodTraits.smartness.score,
        toxicity: c.analysis.spicyTraits.toxicity.score,
        yapLevel: c.analysis.spicyTraits.yapLevel.score,
        egoLevel: c.analysis.spicyTraits.egoLevel.score
      }
    }));

    return Response.json({
      leaderboards: {
        mostToxic: mostToxic.map(c => ({ channel: c.channel, score: c.analysis.spicyTraits.toxicity.score })),
        smartest: smartest.map(c => ({ channel: c.channel, score: c.analysis.goodTraits.smartness.score })),
        mostChaotic: mostChaotic.map(c => ({ channel: c.channel, score: c.analysis.spicyTraits.chaosLevel.score })),
        highestAura: highestAura.map(c => ({ channel: c.channel, score: c.analysis.goodTraits?.aura?.score || 0 })),
        topLanguages,
        topFrameworks
      },
      stats: {
        total: channels.length,
        toxicity: allToxicityScores,
        smartness: allSmartnessScores,
        rawChannels
      }
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch leaderboards" }, { status: 500 });
  }
}
