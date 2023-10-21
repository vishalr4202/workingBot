const User = require("../model/user");
var KiteConnect = require("kiteconnect").KiteConnect;
var KiteTicker = require("kiteconnect").KiteTicker;
const logger = require('../logger/index')
let orderPlaced = false;
let dates = new Date();
exports.shyampoints = (req, res, next) => {
    const {
        price,
        quantity,
        transaction_type,
        exchange,
        tradingsymbol,
        entry_type,
        email,
        lossPrice,
        profitPrice,
        date,
        order
    } = req.body;

    var ticker;
    var api_key, secretkey, requestToken, access_token
    var tick_api, tick_access
    const arr = [];
    const orderIds = [];
    var inst_token;
    let hours = dates.getHours();
    let minutes = dates.getMinutes();
    async function regularOrderPlace(variety, symbol, order_type, prices, type) {
        await kc
            .placeOrder(variety, {
                exchange: exchange,
                tradingsymbol: symbol,
                transaction_type: type ? type : transaction_type,
                quantity: quantity,
                product: exchange == 'NSE' ?  "MIS" : "NRML",
                order_type: order_type ? "LIMIT" : "MARKET",
            })
            .then(async function (resp) {
                logger.info(`${resp?.order_id}, responseID`)
                orderIds.push(resp?.order_id)
                ordered = await resp?.order_id;
                return resp?.order_id;
            })
            .catch(function (err) {
                console.log(err);
            });

        return ordered;
    }


    if((order == 'buy' && entry_type == 'CE' && orderPlaced == false ) || (order == 'sell' && entry_type=='PE' && orderPlaced == false ) || (entry_type == undefined  && exchange == 'NSE' && order=='buy' && orderPlaced == false )){
        logger.info('in request')
    const x = new Promise((resolve, reject) => {
        const data = email.map(async (ele, index) => {
            await User.findByEmailId(ele).then((result) => {
                api_key = result.api_key;
                secretkey = result.secret_key;
                access_token = result.access_token;
                arr.push(ele)
                if (index == 0) {
                    tick_api = result.api_key
                    tick_access = result.access_token
                    
                    logger.info(`in user 1 ${tick_api}, ${index}`)
                }
            }).then(() => {
                kc = new KiteConnect({
                    api_key: api_key,
                });
            }).then(() => {
                kc.setAccessToken(access_token);
                if (entry_type === "CE") {
                    newPrice = Math.round(Math.floor(price - 200) / 100) * 100;
                    symbol = tradingsymbol + date + newPrice + "CE";
                } else if (entry_type === "PE") {
                    newPrice = Math.round(Math.floor(price + 200) / 100) * 100;
                    symbol = tradingsymbol + date + newPrice + "PE";
                } else {
                    symbol = tradingsymbol;
                }
               
                logger.info(`${symbol},symbol`)
                let x = regularOrderPlace("regular", symbol).then((res) => {
                    return res;
                }).catch(err => {
                    
                    logger.error(err)
                });
                return x;
            })
            .then((res) => {
                
                logger.info("buy order placed")
                if(index === 0){
                    return kc
                    .getOrderHistory(res)
                    .then((res) => {
                        inst_token = res[res?.length - 1]?.instrument_token
                    
                    })
                    .catch((err) => {
                      console.log(err, "error");
                    });
                }
                else{
               
                   logger.info(`won't fetch ${ele}`)
                }
              }).then(resp => {
               
              })
                .catch(err => {
                    reject(err)
                })
            if (index === email.length - 1) return resolve({ data, tick_api, tick_access });
        })

    }).then(resp => {
       
        orderPlaced = true;
        logger.info(arr, orderIds, tick_access, tick_api, inst_token,"in tickd")
        let lastPrice = 0
        let stopLoss = 0
        ticker = new KiteTicker({
            api_key: tick_api,
            access_token: tick_access
        })
        ticker.connect()
        ticker.on('connect', subscribe)
        
        ticker.on("ticks", onTicks);
        ticker.autoReconnect(false)
        function onTicks(ticks) {
            console.log(`price is, ${ticks[0]?.last_price}`)
            if (lastPrice == 0) {
                logger.info('firstPrice')
                lastPrice = ticks[0]?.last_price
                stopLoss = ticks[0]?.last_price - Number(lossPrice);
            }
            else if (lastPrice > 0 && ticks[0]?.last_price > lastPrice) {
                lastPrice = ticks[0]?.last_price
                stopLoss = ticks[0]?.last_price - Number(lossPrice);
            }
            else if (stopLoss >= ticks[0]?.last_price) {
                ticker.disconnect()
                logger.info(`will stop,${stopLoss},${email}`)
                let api_key, access_token;
                exits();
            }
        }

        function exits() {
            logger.info(stopLoss)
            const data = email.map((ele, index) => {
                return User.findByEmailId(ele).then((result) => {
                    api_key = result.api_key;
                    secretkey = result.secret_key;
                    access_token = result.access_token;
                })
                    .then(() => {
                        kc = new KiteConnect({
                            api_key: api_key,
                        });
                    }).then(() => {
                        kc.setAccessToken(access_token);
                        if (entry_type === "CE") {
                            newPrice = Math.round(Math.floor(price - 200) / 100) * 100;
                            symbol = tradingsymbol + date + newPrice + "CE";
                        } else if (entry_type === "PE") {
                            newPrice = Math.round(Math.floor(price + 200) / 100) * 100;
                            symbol = tradingsymbol + date + newPrice + "PE";
                        } else {
                            symbol = tradingsymbol;
                        }
                        logger.info(symbol,'sell_symbol')
                        let x = regularOrderPlace("regular", symbol, '', '', 'SELL').then((res) => {
                            return res;
                        });
                        return x;
                    }).then(res =>{
                        logger.info(`r${res},after sell`)
                        orderPlaced = false;
                        return res
                    })
                    .catch(err => {
                        logger.error(`${err},after sell error`)
                        reject(err)
                    })
            })
            res.status(200).json({
                message: "trades executed successfully",
              });
        };

        console.log(ticker.connected());
        function connects() {
            ticker.connect()
            ticker.on('connect', subscribe)
        }
        function subscribe() {
            // var items = [65610759];
            // var items =[64226055]
            var items = [inst_token];
            ticker.subscribe(items);
            ticker.setMode(ticker.modeFull, items);
        }
    })
}
else{
        logger.info("sell order type not placed")
        res.status(200).json({
            message: "trades cannot be executed as order is sell",
          });
 }
}
