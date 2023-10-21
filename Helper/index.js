const User = require("../model/user");
var KiteConnect = require("kiteconnect").KiteConnect;
var KiteTicker = require("kiteconnect").KiteTicker;

module.exports.getValidUsers = async function(users, exchange, symbol) {
    try {
        const data = await User.findByEmailId(users)
        const checkStatus = await checkuser(data, exchange, symbol)
        return checkStatus
    }
    catch (e) {
        return e;
    }
}

 async function checkuser(data, exchange, symbol) {
    const status = await (async function (data) {
        kc = new KiteConnect({
            api_key: data?.api_key,
        });
    })(data)
        .then(resp => {
            kc.setAccessToken(data?.access_token);
        })
        .then((resp) => {
            return kc.getQuote(`${exchange}:${symbol}`)
        }).then(result => {
            return { "email": data?.email, "token": result[`${exchange}:${symbol}`].instrument_token, "api_key": data?.api_key, "access_token": data?.access_token }
        }).catch(err => {
            console.log(data?.email, " Has not logged in today")
        })
    return status
}


module.exports.placeAllUserOrders = async function (users, exchange, symbol, quantity) {
    try {
        const data = await User.findByEmailId(users?.email)
        const checkStatus = await placeIndividualTrade(data, exchange, symbol, quantity)
        return checkStatus
    }
    catch (e) {
        return e;
    }
}

 async function placeIndividualTrade(data, exchange, symbol, quantity) {
    const status = await (async function (data) {
        kc = new KiteConnect({
            api_key: data?.api_key,
        });
    })(data)
        .then(resp => {
            kc.setAccessToken(data?.access_token);
        })
        .then(async (resp) => {
          return await kc
                .placeOrder('regular', {
                    exchange: exchange,
                    tradingsymbol: symbol,
                    transaction_type: "BUY",
                    quantity: quantity,
                    product: exchange == 'NSE' ? "MIS" : "NRML",
                    order_type: "MARKET",
                })
                .then(result => {
                    console.log(result, "trade Data")
                    return data?.email
                })
        }).catch(err => {
            console.log(err, "trade Error")
            return err
        })
    return status
}

module.exports.runTradingStopLoss = async function (user, lossPrice,exits) {
    let lastPrice = 0;
    let stopLoss = 0;
    const status = await (async function (data) {
         ticker = new KiteTicker({
            api_key: user?.api_key,
            access_token: user?.access_token
        })
    })(user)
    .then((resp => {
    ticker.connect()
    ticker.on('connect', subscribe)
    ticker.on("ticks", onTicks);
    ticker.autoReconnect(false)
    function onTicks(ticks,next) {
            console.log(`price is, ${ticks[0]?.last_price}`)
            if (lastPrice == 0) {
                console.log('firstPrice')
                lastPrice = ticks[0]?.last_price
                stopLoss = ticks[0]?.last_price - Number(lossPrice);
                console.log(stopLoss, "insideLoss")
            }
            else if (lastPrice > 0 && ticks[0]?.last_price > lastPrice) {
                lastPrice = ticks[0]?.last_price
                stopLoss = ticks[0]?.last_price - Number(lossPrice);
            }
            else if (stopLoss >= ticks[0]?.last_price) {
                ticker.disconnect()
                console.log(`will stop,${stopLoss}`)
                return exits();
            }
        }
        function subscribe() {
            // var items = [65859591];
            // var items =[64226055]
            var items = [user.token];
            ticker.subscribe(items);
            ticker.setMode(ticker.modeFull, items);
        }
    }))
    // function over(){
    //     console.log("inside main exit")
    //     return exits()
    // }
    // ticker.on('disconnect',() => exits())
    return lastPrice
}

module.exports.exitAllUserOrders = async function (users, exchange, symbol, quantity) {
    try {
        const data = await User.findByEmailId(users?.email)
        const checkStatus = await exitIndividualTrade(data, exchange, symbol, quantity)
        return checkStatus
    }
    catch (e) {
        return e;
    }
}

 async function exitIndividualTrade(data, exchange, symbol, quantity) {
    const status = await (async function (data) {
        kc = new KiteConnect({
            api_key: data?.api_key,
        });
    })(data)
        .then(resp => {
            kc.setAccessToken(data?.access_token);
        })
        .then(async (resp) => {
           return await kc
                .placeOrder('regular', {
                    exchange: exchange,
                    tradingsymbol: symbol,
                    transaction_type: "SELL",
                    quantity: quantity,
                    product: exchange == 'NSE' ? "MIS" : "NRML",
                    order_type: "MARKET",
                }).then(result => {
                    console.log(result,"exit trade Data")
                    return data?.email
                })
        })
        .catch(err => {
            console.log(err, "trade exit Error")
            // return err.message
        })
    return status
}