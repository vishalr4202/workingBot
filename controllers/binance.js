const Binance = require('node-binance-api');


const keys = {
    "trnitin253@gmail.com":{
        APIKEY: 'PfzKG94HJN54Uy5C4mgmPJOlkbrhOlwyz1Q9opOIiWeNPyuBYfNX6NZO9aUDlX31',
        APISECRET: 'c8wrjPp7hS3QDnAhU4sk0mdBkUQ7HLLURChePvYaPf2CpBfMps0zdKfcBoU8Yk1O'
    },
}

exports.placeBinance = async (req, res, next) => {
    var body = req.body
    if (typeof req.body == 'string') {
        if (req.body.charAt(0) == "\"") {
            body = JSON.parse(req.body.slice(1, -1))
        }
        else {
            body = JSON.parse(req.body)
        }
    }
    const {
        market_position,
        order_action,
        order_price,
        quantity,
        entry_price,
        email,
        order_contracts
    } = body;

    // await binance.futuresBalance()
    // await binance.futuresLeverage( 'BTCUSDT', 1 )
    // binance.futuresMarkPriceStream( 'BTCUSDT', console.log );
    const binance = new Binance().options({
        APIKEY: 'PfzKG94HJN54Uy5C4mgmPJOlkbrhOlwyz1Q9opOIiWeNPyuBYfNX6NZO9aUDlX31',
        APISECRET: 'c8wrjPp7hS3QDnAhU4sk0mdBkUQ7HLLURChePvYaPf2CpBfMps0zdKfcBoU8Yk1O'
    });

    let order_quantity = order_contracts.slice(0,5)
    console.log(order_quantity)
    if(order_action == 'buy'){
       await binance.futuresMarketBuy('BTCUSDT', order_quantity)
        .then((resp) => {
            console.log(resp,"resp")
            res.send({
                status:200,
                message: resp,
                type:'buy'
            })
        }).catch(err => {
            console.log(err, "err buy")
        })
    }
    if(order_action == 'sell'){
        await binance.futuresMarketSell('BTCUSDT', order_quantity)
        .then((resp) => {
            res.send({
                status:200,
                message: resp,
                type:'sell'
            })
        }).catch(err => {
            console.log(err, "err sell")
        })
    }
}
