const Binance = require('node-binance-api');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

myEmitter.emit('event');
// import { Telegraf } from 'telegraf';

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

// const runWebSocket = () => {
    
// }
// export const getTrade = (requestedPrice, tradeSym, chatId) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             myEmitter.on(chatId, () => {
//                 console.log('an event occurred!');
//             });
//             let client = startBinance();
//             console.log('asdasdasd');
//             // client.websockets.miniTicker(markets => {
//             //     console.info(markets);
//             //   });
            
//             // let trade = client.websockets.trades(false, (trades) => {
//             //     console.log(trades)
//             //     let { p: price, } = trades;
//             //     price = +price;
//             // });
//             // const bot = new Telegraf(process.env.BOT_TOKEN);
            
//         } catch (error) {
//             console.log('Error in getTrade function', error);
//             reject(error);
//         };
//     });
// };

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