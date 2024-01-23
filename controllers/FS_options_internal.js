// const Helper = require('../Helper/index')
const User = require("../model/user");
const Firstock = require("thefirstock");
var fs = require('fs');
var util = require('util');
var logFile = fs.createWriteStream('log.txt', { flags: 'a' });
  // Or 'w' to truncate the file every time the process starts.
var logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
}
console.error = console.log;
const firstock = new Firstock();

exports.placeFSOPtionsInternal = async (req, res, next) => {
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
        exchange,
        close
    } = body;

    var symbol;
    var transaction_type;
    console.log(order_price)

    if (market_position == 'short' && order_action == 'sell' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(Number(order_price) + 200) / 100) * 100;
        symbol = tradingsymbol + date + 'P' + newPrice;
        transaction_type = 'B'

    }
    if (market_position == 'flat' && order_action == 'buy' && exchange == 'NFO') {
        // if (entry_price !== 'NAN') {
        //     newPrice = Math.round(Math.floor(Number(entry_price) + 200) / 100) * 100;
        // } else {
        //     newPrice = Math.round(Math.floor(Number(close) + 200) / 100) * 100;
        // }

        // // symbol = tradingsymbol + date + newPrice + "PE";
        // symbol = tradingsymbol + date + 'P' + newPrice;
        // transaction_type = 'S'
        res.status(200).json({
            message: `invalid pe sell`,
        });

    }
    if (market_position == 'long' && order_action == 'buy' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(Number(order_price) - 200) / 100) * 100;
        symbol = tradingsymbol + date + 'C' + newPrice;
        transaction_type = 'B'
    }
    if (market_position == 'flat' && order_action == 'sell' && exchange == 'NFO') {
        // if (entry_price !== 'NAN') {
        //     newPrice = Math.round(Math.floor(Number(entry_price) - 200) / 100) * 100;
        // } else {
        //     newPrice = Math.round(Math.floor(Number(close) - 200) / 100) * 100;
        // }
        // symbol = tradingsymbol + date + 'C' + newPrice;
        // transaction_type = 'S'
        res.status(200).json({
            message: `invalid ce sell`,
        });
    }
    if (exchange == 'NSE') {
        symbol = tradingsymbol
    }
    // console.log(symbol, email, transaction_type)

    if (symbol == undefined) {
        res.status(200).json({
            message: "invalid market_position, order_action or symbol",
        });
    }
    const usersValid = [];
    // for (let i = 0; i < email.length; i++) {
    //     User.findByEmailId(email[i])
    //         .then((result) => {
    //             access_token = result.FS_access_token,
    //             UID = result.FS_uid
    //             return result
    //         }).then((resp) => {
    //             const x = firstock.placeOrder(
    //                 {
    //                     userId: UID,
    //                     jKey: access_token
    //                 },
    //                 {
    //                     exchange: "NFO",
    //                     tradingSymbol: symbol,
    //                     quantity: quantity,
    //                     price: '0',
    //                     product: "M",
    //                     transactionType: transaction_type,
    //                     priceType: "MKT",
    //                     retention: "IOC",
    //                     triggerPrice: "0",
    //                     remarks: "place order",
    //                 },
    //                 (err, result) => {
    //                     // console.log("Error, ", err);
    //                     // console.log("Result: ", result);
    //                     if (result?.status == 'Success') {
    //                         usersValid.push(resp.email)
    //                     }

    //                     if (i == email.length - 1) {
    //                         console.log(usersValid)
    //                         res.status(200).json({
    //                             message: `orders placed for ${usersValid}`,
    //                         });
    //                     }
    //                 }
    //             )
    //         })
    // }

    function placeTrades(transactionType) {
        for (let i = 0; i < email.length; i++) {
            User.findByEmailId(email[i])
                .then((result) => {
                    access_token = result?.FS_access_token,
                        UID = result?.FS_uid
                    return result
                }).then((resp) => {
                    if (access_token != undefined && UID != undefined) {
                        const x = firstock.placeOrder(
                            {
                                userId: UID,
                                jKey: access_token
                            },
                            {
                                exchange: "NFO",
                                tradingSymbol: symbol,
                                quantity: quantity,
                                price: '0',
                                product: "M",
                                transactionType: transactionType,
                                priceType: "MKT",
                                retention: "IOC",
                                triggerPrice: "0",
                                remarks: "place order",
                            },
                            (err, result) => {
                                // console.log("Error, ", err);
                                // console.log("Result: ", result);
                                if (result?.status == 'Success' && transactionType == 'S') {
                                    usersValid.push(resp.email)
                                }
                            }
                        )
                    }

                })
        }
    }

    placeTrades('B')
    console.log(email[0], "user")
    User.findByEmailId(email[0])
        .then((result) => {
            access_token = result?.FS_access_token,
                UID = result?.FS_uid
            return result
        }).then((resp) => {
            firstock.searchScripts({ stext: symbol, userId: UID, jKey: access_token, }, (err, result) => {
                console.log("Error, ", err);
                // console.log("Result: ", result);
                if (result) {
                    token = result?.values[0]?.token
                    console.log(token)
                    const ws = firstock.initializeWebSocket(2);
                    ws.on("open", function open() {
                        firstock.getWebSocketDetails({ UID: UID, jKey: access_token }, (err, result) => {
                            if (!err) {
                                firstock.initialSendWebSocketDetails(ws, result, () => {
                                    //Subscribe Feed
                                    ws.send(firstock.subscribeFeedAcknowledgement(`NFO|${token}`)); //Sending NIFTY 50 and BANKNIFTY Token
                                });
                            }
                        });
                    });
                    let lastPrice = 0;
                    let startPrice = 0;
                    let stopLoss = 0;
                    let profit1, profit2, profit3;
                    ws.on("error", function error(error) {
                        console.log(`WebSocket error: ${error}`);
                    });
                    ws.on("message", function message(data) {
                        const result = firstock.receiveWebSocketDetails(data);
                        // console.log("message: ", result);
                        if (result?.lp) {
                            if (startPrice == 0) {
                                startPrice =  Number(result?.lp)
                                lastPrice = Number(result?.lp) 
                                stopLoss = Number(result?.lp) - 30
                                profit1 = Number(result?.lp) + 40
                                profit2 = Number(result?.lp) + 60
                                profit3 = Number(result?.lp) + 80
                                console.log(startPrice, "startPrice")
                                console.log(lastPrice,"last")
                                // placeTrades('S')
                                // console.log(result?.lp)
                              
                            }
                            if ( Number(result?.lp)> lastPrice) {
                                lastPrice =  Number(result?.lp)
                                // stopLoss = result?.lp - 20
                            }
                            console.log(lastPrice,"last")
                            console.log(stopLoss,"stop")
                            if (lastPrice >= profit1 && lastPrice < profit2) {
                                stopLoss = Number(lastPrice) - 15
                                console.log(result?.lp, "in profit 1")
                            }
                            if (lastPrice >= profit2 && lastPrice < profit3) {
                                stopLoss = Number(lastPrice) - 20
                                console.log(result?.lp, "in profit 2")
                            }
                            if (lastPrice >= profit3) {
                                stopLoss = Number(lastPrice) - 10
                                console.log(result?.lp, "in profit 3")
                            }
                            if (lastPrice <= stopLoss) {
                                console.log("exit Trades");
                                let ws = firstock.initializeWebSocket(2);
                                ws.on("open", function open() {
                                    firstock.getWebSocketDetails({ UID: UID, jKey: access_token },(err, disconnectResult) => {
                                      if (!err) {
                                        firstock.initialSendWebSocketDetails(ws, disconnectResult, () => {
                                          ws.send(firstock.unsubscribeFeed(`NFO|${token}`));
                                        });
                                        placeTrades('S')
                                        res.status(200).json({
                                            message: `orders placed: exit:${result?.lp}, entry:${startPrice}`,
                                        });
                                      }
                                    });
                                  });
                            }
                        }
                    });
                }
            });
        })
}
