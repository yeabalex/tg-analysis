import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const AVATAR_CACHE_TTL_SECONDS = 60 * 60 * 24;
const FALLBACK_CACHE_TTL_SECONDS = 60 * 5;

function getFallbackAvatar(channel: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(channel)}&background=1A1A1A&color=FF6B00&size=150&bold=true`;
}

function extractAvatarUrl(html: string) {
  const $ = cheerio.load(html);
  const candidates = [
    $('.tgme_page_photo_image').attr('src'),
    $('meta[property="og:image"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('.tgme_page_photo_image').attr('style')?.match(/url\(["']?(.*?)["']?\)/)?.[1],
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || null;
}

function redirectTo(url: string) {
  return NextResponse.redirect(url, {
    headers: {
      'Cache-Control': `public, max-age=${FALLBACK_CACHE_TTL_SECONDS}, s-maxage=${FALLBACK_CACHE_TTL_SECONDS}`,
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawChannel = searchParams.get('channel');
  
  if (!rawChannel) {
    return new NextResponse('Missing channel', { status: 400 });
  }

  const channel = rawChannel.replace(/^@/, '').trim();
  if (!channel) {
    return new NextResponse('Missing channel', { status: 400 });
  }

  const fallback = getFallbackAvatar(channel);
  const cacheKey = `avatar:${channel.toLowerCase()}`;
  const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

  try {
    if (redis) {
      const cachedAvatar = await redis.get(cacheKey);
      if (cachedAvatar) {
        return redirectTo(cachedAvatar);
      }
    }

    const res = await fetch(`https://t.me/${channel}`, {
      next: { revalidate: AVATAR_CACHE_TTL_SECONDS },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; tgchannel-analysis/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!res.ok) {
      if (redis) {
        await redis.set(cacheKey, fallback, 'EX', FALLBACK_CACHE_TTL_SECONDS);
      }
      return redirectTo(fallback);
    }
    
    const html = await res.text();
    const avatarUrl = extractAvatarUrl(html) || fallback;
    
    if (redis) {
      const isFallback = avatarUrl === fallback;
      await redis.set(
        cacheKey,
        avatarUrl,
        'EX',
        isFallback ? FALLBACK_CACHE_TTL_SECONDS : AVATAR_CACHE_TTL_SECONDS
      );
    }

    return redirectTo(avatarUrl);
  } catch (err) {
    if (redis) {
      await redis.set(cacheKey, fallback, 'EX', FALLBACK_CACHE_TTL_SECONDS);
    }
    return redirectTo(fallback);
  } finally {
    redis?.disconnect();
  }
}
