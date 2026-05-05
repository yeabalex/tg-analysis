import * as cheerio from 'cheerio';
import { z } from 'zod';

export const analyzerSchema = z.object({
  identity: z.object({
    devRank: z.string().describe("A funny gamer/dev rank, e.g. 'Terminally Online' or 'Ghost'"),
    activityLevel: z.string().describe("E.g., Active, Ghost, Terminally Online"),
  }),
  goodTraits: z.object({
    usefulness: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    smartness: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    positivity: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    cool: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    funny: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    basedLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    aura: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
  }),
  spicyTraits: z.object({
    toxicity: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    yapLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    chaosLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    egoLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    overconfidence: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    brainrotLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
    delusionLevel: z.object({ score: z.number().describe("Scale 1-100"), description: z.string().describe("Very short reason") }),
  }),
  personalityType: z.object({
    title: z.string().describe("e.g. 'Chaotic Genius', 'Silent Architect', 'Debate Warrior'. Draw from a highly diverse and holistic pool of internet/dev archetypes."),
    description: z.string().describe("A vivid 1-2 sentence description explaining why they are this archetype."),
  }),
  strengthsAndWeaknesses: z.object({
    strengths: z.array(z.string()).describe("At least 2 sharp, funny, but true strengths based on their logs."),
    weaknesses: z.array(z.string()).describe("At least 2 sharp, funny, but true weaknesses based on their logs."),
  }),
  mostLikelyTo: z.string().describe("A high-school yearbook style superlative (e.g., 'Most likely to drop the production database by accident')."),
  signatureTraits: z.array(z.string()).describe("Fun section: Auto-generated funny observations (e.g., 'Appears only when things are broken', 'Argues like it is a sport')"),
  ifTheyWere: z.object({
    programmingLanguage: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
    framework: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
    footballClub: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
    movieVillain: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
    operatingSystem: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
    webBrowser: z.object({ name: z.string(), description: z.string().describe("Max 1 sentence explaining why") }),
  })
});

export async function scrapeTelegramChannel(channelName: string): Promise<string[]> {
  const messages: string[] = [];
  let fetchUrl = `https://t.me/s/${channelName}`;
  let pagesFetched = 0;

  while (messages.length < 50 && pagesFetched < 4) {
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      if (pagesFetched === 0) {
        throw new Error("Failed to fetch Telegram channel. Make sure it is public.");
      }
      break;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const pageMessages: string[] = [];
    $('.tgme_widget_message').each((i, el) => {
      if ($(el).find('[class*="forwarded"]').length > 0) return;

      const isReply = $(el).find('.tgme_widget_message_reply').length > 0;
      const authorHref = $(el).find('.tgme_widget_message_owner_name').attr('href');
      if (authorHref && !authorHref.toLowerCase().includes(`/${channelName.toLowerCase()}`) && !isReply) {
        return;
      }

      const textNode = $(el).find('.js-message_text');
      if (!textNode.length) return;

      textNode.find('.tgme_widget_message_link_preview').remove();
      
      const text = textNode.text().trim();
      if (!text) return;

      if (text.toLowerCase().includes('forwarded from') || text.toLowerCase().includes('переслано от')) return;

      const timeNode = $(el).find('.tgme_widget_message_date time');
      const datetime = timeNode.attr('datetime') || timeNode.text() || 'Unknown Date';

      const words = text.split(/\s+/);
      const truncated = words.slice(0, 30).join(' ');

      pageMessages.push(`[${datetime}] Message: ${truncated}${words.length > 40 ? '...' : ''}`);
    });

    messages.unshift(...pageMessages);

    const firstMessage = $('.tgme_widget_message').first();
    const dataPost = firstMessage.attr('data-post');
    if (!dataPost) break;

    const beforeId = dataPost.split('/')[1];
    if (!beforeId) break;

    fetchUrl = `https://t.me/s/${channelName}?before=${beforeId}`;
    pagesFetched++;
  }

  return messages;
}

export function generatePrompt(channelName: string, recentMessages: string) {
  return `
    You are an edgy, hilarious, and highly observant developer behavior analyst. 
    Analyze the following recent chat logs from the public Telegram channel @${channelName}. 
    Give the channel owner a brutal, funny, but accurate personality assessment based on what they post about.

    CRITICAL RULES:
    - DO NOT reference or quote specific posts, messages, or exact things they said. 
    - DO NOT say things like "you posted about X" or "in one message you said Y".
    - Instead, identify OVERALL PATTERNS, VIBES, and RECURRING THEMES from their content.
    - Your descriptions should feel like a personality reading, not a post-by-post summary.
    - Be general: "You radiate chaos energy" NOT "Your post about debugging at 3am shows chaos energy".
    - Focus on the overall persona, tone, interests, and energy — not individual data points.
    - Keep descriptions SHORT, PUNCHY, and FUNNY. Max 1-2 sentences per description field.
    
    CHAT LOGS:
    ${recentMessages}
  `;
}
