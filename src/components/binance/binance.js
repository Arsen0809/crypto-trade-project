const Binance = require('node-binance-api');
import { generateAnswer } from '../../utils'
import { Telegraf } from 'telegraf';

let client = null

export const startBinance = () => {
  if (!client) {
    client = new Binance().options({
      APIKEY: process.env.BINANCE_API_KEY,
      APISECRET: process.env.BINANCE_SECRET_KEY,
      reconnect: false,
    });
  }
  return client;
}

export const getCurrentTrade = async (tradeSym) => {
  try {
    const client = startBinance();
    const res = await client.prices(tradeSym);
    return +res[tradeSym];
  } catch (error) {
    console.log('Error in getCurrentTrade function', error);
    throw error;
  };
};


export const priceStream = (sessionStore) => {
  try {
    const bot = new Telegraf(process.env.BOT_TOKEN);
    const binance = startBinance();
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
  } catch (error) {
    console.log(error);
    throw error
  }
}