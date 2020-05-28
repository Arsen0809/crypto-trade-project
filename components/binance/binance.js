const Binance = require('node-binance-api');
import { Telegraf } from 'telegraf';

const binanceInstance = () => new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY,
    reconnect: false,
});

export const getTrade = (requestedPrice, tradeSym, chatId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const bot = new Telegraf(process.env.BOT_TOKEN);
            const binance = binanceInstance();
            let trade = await binance.websockets.trades([tradeSym], async (trades) => {
                let { p: price, } = trades;
                price = +price;
                let endpoints = binance.websockets.subscriptions();
                if (price.toFixed(2) >= requestedPrice) {
                    await endpoints[trade].terminate();
                    bot.telegram.sendMessage(chatId, `Your alert for ${requestedPrice} was hit`);
                    resolve(price);
                };
            });
        } catch (error) {
            console.log('Error in getTrade function', error);
            reject(error);
        };
    });
};

export const getCurrentTrade = (tradeSym) => {
    return new Promise(async (resolve, reject) => {
        try {
            const binance = binanceInstance();
            const res = await binance.prices(tradeSym);
            resolve(res[tradeSym]);
        } catch (error) {
            console.log('Error in getCurrentTrade function', error);
            reject(error);
        };
    });
};