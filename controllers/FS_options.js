// const Helper = require('../Helper/index')
const User = require("../model/user");
const Firstock = require("thefirstock");

const firstock = new Firstock();

exports.placeFSOPtions = async (req, res, next) => {
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

    if (market_position == 'short' && order_action == 'sell' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(order_price + 200) / 100) * 100;
        symbol = tradingsymbol + date  + "P" + newPrice;
        transaction_type = 'B'
    }
    if (market_position == 'flat' && order_action == 'buy' && exchange == 'NFO') {
        if(entry_price !== 'NAN'){
            newPrice = Math.round(Math.floor(entry_price + 200) / 100) * 100;
        } else{
            newPrice = Math.round(Math.floor(close + 200) / 100) * 100;
        }
       
        // symbol = tradingsymbol + date + newPrice + "PE";
        symbol = tradingsymbol + date  + "P" + newPrice;
        transaction_type = 'S'
    }
    if (market_position == 'long' && order_action == 'buy' && exchange == 'NFO') {
        newPrice = Math.round(Math.floor(order_price - 200) / 100) * 100;
        symbol = tradingsymbol + date + 'C'+ newPrice ;
        transaction_type = 'B'
    }
    if (market_position == 'flat' && order_action == 'sell' && exchange == 'NFO') {
        if(entry_price !== 'NAN'){
        newPrice = Math.round(Math.floor(entry_price - 200) / 100) * 100;
        }else{
            newPrice = Math.round(Math.floor(close - 200) / 100) * 100;
        }
        symbol = tradingsymbol + date + 'C'+ newPrice ;
        transaction_type = 'S'
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
    const usersValid = [];
    for(let i=0; i<email.length; i++){
      User.findByEmailId(email[i])
        .then((result) => {
           access_token = result.FS_access_token,
           UID = result.FS_uid
           return result
        }).then((resp) => {
           const x =  firstock.placeOrder(
                {
                  userId: UID,
                  jKey: access_token
                },
                {
                  exchange: "NFO",
                  tradingSymbol: symbol,
                  quantity: quantity,
                  price:  '0',
                  product: "M",
                  transactionType: transaction_type,
                  priceType:  "MKT",
                  retention: "IOC",
                  triggerPrice: "0",
                  remarks: "place order",
                },
                (err, result) => {
                    // console.log("Error, ", err);
                    // console.log("Result: ", result);
                    if(result?.status == 'Success'){
                        usersValid.push(resp.email)
                    }
                    
                    if(i == email.length-1){
                        console.log(usersValid)
                        res.status(200).json({
                            message: `orders placed for ${usersValid}`,
                        });
                    }

                    // if (result && result != null) {
                    //     firstock.singleOrderHistory(
                    //       { userId: UID, jKey: access_token, orderNumber: result?.data?.orderNumber },
                    //       (err1, result1) => {
                    //         console.log("Error, ", err1);
                    //         console.log("Result: ", result1);
                    //         if (result1 && result1 !== null && result1?.data[0]?.status == 'REJECTED') {
                    //         console.log(email[i],"res")
                    //         // usersValid.push({  order_id: result1?.data[0]?.orderNumber })
                    //         usersValid.push(email[i])
                    //         }
                    //         if(i == email.length-1){
                    //             console.log(usersValid,"valids")
                    //                 res.status(200).json({
                    //                     message: `orders placed ${usersValid}`,
                    //                 });   
                    //         }
                    //       }
                    //     );
                    //   }
                }
            )
        })
    }
}
