/**
 * Script to register the Telegram Bot webhook with your Vercel deployment.
 * 
 * Run with: node setup-webhook.js
 * 
 * This tells Telegram: "Send all bot updates to my Vercel endpoint"
 * so the bot can respond to /start, /analyze, /help etc.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728979805:AAGJPUpQCEnwHcKLOjlJqELnjVN3hkHOn0I';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tg-analysis.vercel.app';
const WEBHOOK_URL = `${APP_URL}/api/telegram`;

async function setupWebhook() {
  console.log('🔧 Setting up Telegram webhook...');
  console.log(`   Bot Token: ${BOT_TOKEN.slice(0, 10)}...`);
  console.log(`   Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  // Step 1: Delete any existing webhook
  console.log('1️⃣  Removing old webhook...');
  const deleteRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  const deleteData = await deleteRes.json();
  console.log('   ', deleteData.ok ? '✅ Done' : `❌ Failed: ${deleteData.description}`);

  // Step 2: Set new webhook
  console.log('2️⃣  Setting new webhook...');
  const setRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ['message'],  // We only need message updates
      drop_pending_updates: true,     // Don't process old queued messages
    }),
  });
  const setData = await setRes.json();
  console.log('   ', setData.ok ? '✅ Webhook set successfully!' : `❌ Failed: ${setData.description}`);

  // Step 3: Verify webhook info
  console.log('3️⃣  Verifying webhook...');
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const infoData = await infoRes.json();
  console.log(`   URL: ${infoData.result.url}`);
  console.log(`   Pending updates: ${infoData.result.pending_update_count}`);
  console.log(`   Last error: ${infoData.result.last_error_message || 'None'}`);

  // Step 4: Set bot commands menu
  console.log('4️⃣  Setting bot commands menu...');
  const cmdRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: '🚀 Start the bot' },
        { command: 'analyze', description: '🔍 Analyze a channel — /analyze channelname' },
        { command: 'help', description: '📖 Show help' },
      ]
    }),
  });
  const cmdData = await cmdRes.json();
  console.log('   ', cmdData.ok ? '✅ Commands registered!' : `❌ Failed: ${cmdData.description}`);

  console.log('\n🎉 All done! Your bot will now respond to messages on Vercel.');
  console.log(`   Try it: https://t.me/${BOT_TOKEN.split(':')[0]}`);
}

setupWebhook().catch(console.error);
