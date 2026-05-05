import { NextRequest } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tg-analysis.vercel.app';

// Telegram sends updates to this endpoint via webhook
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Handle /start command
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      const firstName = update.message.from?.first_name || 'there';

      if (text === '/start') {
        await sendMessage(chatId, 
          `👋 Hey ${firstName}!\n\n` +
          `🔥 I'm the *Channel Analyzer Bot* — I roast your Telegram channel's personality using AI.\n\n` +
          `📊 Here's what I do:\n` +
          `• Scan your public channel messages\n` +
          `• Generate a brutally honest personality breakdown\n` +
          `• Score traits like Toxicity, Smartness, Aura & more\n` +
          `• Compare you against other channels\n\n` +
          `👇 *Tap the button below to get started!*`,
          {
            inline_keyboard: [[
              { text: '🚀 Open Analyzer', web_app: { url: APP_URL } }
            ]]
          }
        );
        return Response.json({ ok: true });
      }

      // Handle /analyze <channel> shortcut
      if (text.startsWith('/analyze')) {
        const parts = text.split(' ');
        const channelName = parts[1]?.replace('@', '').trim();

        if (!channelName) {
          await sendMessage(chatId,
            `⚠️ Please provide a channel name!\n\n` +
            `Usage: \`/analyze channelname\`\n` +
            `Example: \`/analyze durov\``,
          );
          return Response.json({ ok: true });
        }

        await sendMessage(chatId,
          `🔍 Opening analyzer for *@${channelName}*...`,
          {
            inline_keyboard: [[
              { text: '📊 View Analysis', web_app: { url: `${APP_URL}?channel=${channelName}` } }
            ]]
          }
        );
        return Response.json({ ok: true });
      }

      // Handle /help command
      if (text === '/help') {
        await sendMessage(chatId,
          `📖 *Channel Analyzer Help*\n\n` +
          `*Commands:*\n` +
          `• /start — Welcome message & open the app\n` +
          `• /analyze <channel> — Quick analyze a channel\n` +
          `• /help — Show this help message\n\n` +
          `*How it works:*\n` +
          `1. Open the mini app using the button\n` +
          `2. Enter a public Telegram channel username\n` +
          `3. Wait for the AI to analyze it\n` +
          `4. Get your personality breakdown! 🔥\n\n` +
          `_Results are cached for 24 hours._`,
        );
        return Response.json({ ok: true });
      }

      // Default response for unknown messages
      await sendMessage(chatId,
        `🤖 I don't understand that command.\n\nTry /help to see what I can do, or tap the button below to open the analyzer!`,
        {
          inline_keyboard: [[
            { text: '🚀 Open Analyzer', web_app: { url: APP_URL } }
          ]]
        }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Always return 200 to Telegram so it doesn't retry
    return Response.json({ ok: true });
  }
}

// GET endpoint for health check / webhook verification
export async function GET() {
  return Response.json({ 
    status: 'Telegram webhook is active',
    webhook: `${APP_URL}/api/telegram`
  });
}

// Helper to send messages via Telegram Bot API
async function sendMessage(
  chatId: number, 
  text: string, 
  replyMarkup?: object
) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to send Telegram message:', err);
  }
}
