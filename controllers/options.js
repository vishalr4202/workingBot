const Helper = require('../Helper/index')

exports.placeOPtions = async (req, res, next) => {
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
        tradingsymbol,
        date,
        exchange
    } = body;

    var symbol;
    var transaction_type;

    if (market_position == 'short' && order_action == 'sell' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(order_price + 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "PE";
        transaction_type = 'BUY'
    }
    if (market_position == 'flat' && order_action == 'buy' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(entry_price + 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "PE";
        transaction_type = 'SELL'
    }
    if (market_position == 'long' && order_action == 'buy' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(order_price - 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "CE";
        transaction_type = 'BUY'
    }
    if (market_position == 'flat' && order_action == 'sell' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(entry_price - 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "CE";
        transaction_type = 'SELL'
    }
    if (exchange == 'NSE') {
        symbol = tradingsymbol
    }
    console.log(symbol, email, transaction_type)

    if (symbol == undefined) {
        res.status(200).json({
            message: "invalid market_position, order_action or symbol",
        });
    }
    const validUsers = []
    for (let i = 0; i < email.length; i++) {
        let valid = await Helper.getValidUsers(email[i], exchange, symbol)
        // console.log(valid,"valid")
        if (valid) {
            validUsers.push(valid)
        }
        if (i == email.length - 1 && validUsers?.length > 0) {
            ordered = true
        }
    }
    if (validUsers.length == 0 && symbol) {
        res.status(200).json({
            message: "trades wont be placed, no valid user or instrument is not trading",
        });
    }

    const orderPlaced = []
    if (validUsers.length > 0) {
        for (let i = 0; i < validUsers.length; i++) {
            let placed = await Helper.placeAllOptionsUserOrders(validUsers[i], exchange, symbol, quantity, transaction_type)
            console.log(placed.status)
            if (placed.status !== 'error') {
                console.log(placed, "inplaced")
                orderPlaced.push(placed);
            }
        }
    }

    if (orderPlaced?.length > 0 && symbol) {
        res.status(200).json({
            message: `order placed for ${orderPlaced}`,
        });
    }
    if (orderPlaced?.length == 0 && symbol) {
        res.status(200).json({
            message: `orders not placed`,
        });
    }
}