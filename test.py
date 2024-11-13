import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# Replace 'YOUR_BOT_TOKEN' with your actual bot token
TOKEN = "7671105898:AAEjqEW08MscySBNV0p_EqRqOEn5sivWLmo"
bot = telebot.TeleBot(TOKEN)

# Handler for the /start command
@bot.message_handler(commands=['start'])
def send_start_message(message):
    # Create an inline keyboard
    keyboard = InlineKeyboardMarkup()
    
    # Add a Mini App button using WebAppInfo
    webapp_info = WebAppInfo(url="https://your-webapp-url.com")  # Replace with your Mini App URL
    webapp_button = InlineKeyboardButton("Open Mini App", web_app=webapp_info)
    keyboard.add(webapp_button)
    
    # Send a message with the inline keyboard
    bot.send_message(message.chat.id, "Welcome! Click the button below to open the Mini App.", reply_markup=keyboard)

# Start polling
bot.polling()
