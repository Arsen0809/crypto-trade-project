
import dotenv from 'dotenv';
import { getTrade, getCurrentTrade, startBinance } from './components/binance/binance';
import { Telegraf } from 'telegraf';
dotenv.config();

const binance = startBinance();
const sessionStore = new Map();

const generateAnswer = (options) => `Current price of ${options.symbol} is ${options.currentPrice} therefore it's ${options.status} ${options.status === 'equal'? 'to' : 'from'} ${options.setPrice}`

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(Telegraf.session({store: sessionStore}))
bot.start((ctx) => {
  ctx.reply('Hi! for setting alerts type for example /alert when BTC/USDT is 9400')
});


bot.hears(/alert when .*[a-zA-Z] is .*/g, async (ctx) => {
  
  const price = +ctx.match[0].split(' ')[4];
  const tradeSym = ctx.match[0].split(' ')[2].replace('/', '');
  if (ctx.session.currencies) ctx.session.currencies[tradeSym] = {price, tradeSym};
  else ctx.session.currencies = {[tradeSym]: {price, tradeSym}};
  ctx.session.chatId = ctx.message.chat.id;
  const currentPrice = await getCurrentTrade(tradeSym);
  await ctx.reply(`Ok the current value is ${currentPrice} I will set an alert`);
  await ctx.reply(`If you want to remove alert please use following command \n 'remove alert for {currency}/{exchange_currency}' without quote 🤣`);
  // ctx.session.status is equal to 0 ()
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

})
bot.hears(/remove alert for .*[a-zA-Z]/g, async (ctx) => {
  const tradeSym = ctx.match[0].split(' ')[3].replace('/', '');
  if (ctx.session.currencies && ctx.session.currencies[tradeSym]) {
    delete ctx.session.currencies[tradeSym]
    ctx.reply(`Your alert for ${tradeSym} has been removed`);
  } else {
    ctx.reply(`You have not set alert for ${tradeSym}`);
  }
})

bot.hears(/.*/g, async (ctx) => {
  ctx.reply("I don't understand you. If you want to set alert for specific exchange please use following pattern \n 'alert when {currency}/{exchange_currency} is {value}'");

})

binance.futuresMarkPriceStream((currencies) => {
  const values = Array.from(sessionStore.entries());
  values.forEach(([key, value]) => {
    const chatId = key.split(':')[0];
    currencies.find((elem) => {
      if (value.session.currencies && value.session.currencies[elem.symbol]) {
        const currentCurrency = value.session.currencies[elem.symbol]
        switch (currentCurrency.status) {
          case 'above':
            if (+elem.markPrice < currentCurrency.price) {
              currentCurrency.status = 'below'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            } else if (+elem.markPrice === currentCurrency.price) {
              currentCurrency.status = 'equal'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            };
            break;
          case 'below':
            if (+elem.markPrice > currentCurrency.price) {
              currentCurrency.status = 'above'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            } else if (+elem.markPrice === currentCurrency.price) {
              currentCurrency.status = 'equal'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            };
            break;
          case 'equal':
            if (+elem.markPrice > currentCurrency.price) {
              currentCurrency.status = 'above'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            } else if (+elem.markPrice < currentCurrency.price) {
              currentCurrency.status = 'below'
              bot.telegram.sendMessage(chatId,
                generateAnswer({
                  symbol: currentCurrency.tradeSym,
                  setPrice: currentCurrency.price,
                  currentPrice: +elem.markPrice,
                  status: currentCurrency.status
                })
              );
            };
            break;
        }
      }
    })
  })
});
// setAlert, async (ctx) => { });

bot.startPolling();
