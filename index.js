
import dotenv from 'dotenv';
import { getTrade, getCurrentTrade } from './components/binance/binance';
import { Telegraf } from 'telegraf';
dotenv.config();

const setAlert = async (ctx) => {
  let price = +ctx.match[0].split(' ')[4];
  let tradeSym = ctx.match[0].split(' ')[2].replace('/', '');
  let currentPrice = await getCurrentTrade(tradeSym);
  ctx.reply(`Ok the current value is ${currentPrice} I will set an alert`);
  getTrade(price, tradeSym, ctx.message.chat.id);
};

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Hi! for setting alerts type for example /alert when BTC/USDT is 9400'));
bot.hears(/alert when .*[a-zA-Z] is .*/g, setAlert, async (ctx) => { });
bot.startPolling();
