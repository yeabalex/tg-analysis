import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel');
  
  if (!channel) {
    return new NextResponse('Missing channel', { status: 400 });
  }

  const fallback = `https://ui-avatars.com/api/?name=${channel}&background=1A1A1A&color=FF6B00&size=150&bold=true`;

  try {
    const res = await fetch(`https://t.me/${channel}`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!res.ok) {
      return NextResponse.redirect(fallback);
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const pfp = $('.tgme_page_photo_image').attr('src');
    
    if (pfp) {
      return NextResponse.redirect(pfp);
    } else {
      return NextResponse.redirect(fallback);
    }
  } catch (err) {
    return NextResponse.redirect(fallback);
  }
}
