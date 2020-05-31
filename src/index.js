
import express from 'express';
import { priceStream, getCurrentTrade } from './components/binance/binance';
import { generateAnswer } from './utils';
import { Telegraf } from 'telegraf';

const sessionStore = new Map();

// saying Hi

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(Telegraf.session({store: sessionStore}))
bot.start((ctx) => {
  ctx.reply('Hi! for setting alerts type for example /alert when BTC/USDT is 9400')
});

// setting alerts 

bot.hears(/alert when .*[a-zA-Z] is .*/g, async (ctx) => {
  const price = +ctx.match[0].split(' ')[4];
  const tradeSym = ctx.match[0].split(' ')[2].replace('/', '');
  console.log('session', ctx.session);
  if (ctx.session.currencies) ctx.session.currencies[tradeSym] = {price, tradeSym};
  else ctx.session.currencies = {[tradeSym]: {price, tradeSym}};
  ctx.session.chatId = ctx.message.chat.id;
  const currentPrice = await getCurrentTrade(tradeSym);
  await ctx.reply(`Ok the current value is ${currentPrice} I will set an alert`);
  await ctx.reply(`If you want to remove alert please use following command \n 'remove alert for {currency}/{exchange_currency}' without quote 🤣`);
  if (currentPrice > ctx.session.currencies[tradeSym].price) {
    ctx.session.currencies[tradeSym].status = 'above'
    ctx.reply(
      generateAnswer({
        symbol: ctx.session.currencies[tradeSym].tradeSym,
        setPrice: ctx.session.currencies[tradeSym].price,
        currentPrice,
        status: ctx.session.currencies[tradeSym].status
      })
    );
  } else if (currentPrice < ctx.session.currencies[tradeSym].price) {
    ctx.session.currencies[tradeSym].status = 'below'
    ctx.reply(
      generateAnswer({
        symbol: ctx.session.currencies[tradeSym].tradeSym,
        setPrice: ctx.session.currencies[tradeSym].price,
        currentPrice,
        status: ctx.session.currencies[tradeSym].status
      })
    );
  } else if (currentPrice === ctx.session.currencies[tradeSym].price) {
    ctx.session.currencies[tradeSym].status = 'equal'
    ctx.reply(
      generateAnswer({
        symbol: ctx.session.currencies[tradeSym].tradeSym,
        setPrice: ctx.session.currencies[tradeSym].price,
        currentPrice,
        status: ctx.session.currencies[tradeSym].status
      })
    );
  };
});

// remove alerts

bot.hears(/remove alert for .*[a-zA-Z]/g, async (ctx) => {
  const tradeSym = ctx.match[0].split(' ')[3].replace('/', '');
  if (ctx.session.currencies && ctx.session.currencies[tradeSym]) {
    delete ctx.session.currencies[tradeSym]
    ctx.reply(`Your alert for ${tradeSym} has been removed`);
  } else {
    ctx.reply(`You have not set alert for ${tradeSym}`);
  }
});

// validate messages 

bot.hears(/.*/g, async (ctx) => {
  ctx.reply("I don't understand you. If you want to set alert for specific exchange please use following pattern \n 'alert when {currency}/{exchange_currency} is {value}'");
})

// Hiting alerts

priceStream(sessionStore)

bot.startPolling();

//  server

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on ${port} port`));
