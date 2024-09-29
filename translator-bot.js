const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

async function translateText(text, targetLanguage = 'English') {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text to ${targetLanguage}. Only respond with the translation, no additional text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error translating text:', error);
    return 'Error: Unable to translate text.';
  }
}

bot.on('message', async (msg) => {
  if (msg.reply_to_message && msg.text && msg.text.includes('@translatorwavebot')) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const textToTranslate = msg.reply_to_message.text;

    if (!textToTranslate) {
      bot.sendMessage(chatId, 'Please reply to a text message to translate.', { reply_to_message_id: messageId });
      return;
    }

    let targetLanguage = 'English';
    const commandParts = msg.text.split(' ');
    if (commandParts.length > 1) {
      targetLanguage = commandParts.slice(1).join(' ');
    }

    bot.sendMessage(chatId, 'Translating...', { reply_to_message_id: messageId });

    try {
      const translatedText = await translateText(textToTranslate, targetLanguage);
      bot.sendMessage(chatId, `Translated to ${targetLanguage}:\n\n${translatedText}`, { reply_to_message_id: messageId });
    } catch (error) {
      console.error('Translation error:', error);
      bot.sendMessage(chatId, 'An error occurred while translating. Please try again later.', { reply_to_message_id: messageId });
    }
  }
});

bot.on('polling_error', (error) => {
  console.log(error);
});

console.log('Translator bot is running...');