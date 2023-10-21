const Helper = require('../Helper/index')
let ordered = false;

exports.executeSL = async (req, res, next) => {
    var body = req.body
    if(typeof req.body == 'string'){
        if(req.body.charAt(0) =="\""){
            body = JSON.parse(req.body.slice(1, -1))
        }
        else{
           body = JSON.parse(req.body)
        }
    }
    
    const {
        price,
        quantity,
        exchange,
        tradingsymbol,
        entry_type,
        email,
        lossPrice,
        date,
        order,
    } = body;

    var symbol;
    

    if (entry_type === "CE") {
        newPrice = Math.round(Math.floor(price - 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "CE";
    } else if (entry_type === "PE") {
        newPrice = Math.round(Math.floor(price + 200) / 100) * 100;
        symbol = tradingsymbol + date + newPrice + "PE";
    } else {
        symbol = tradingsymbol;
    }

    if((order == 'buy' && entry_type == 'CE' && ordered == false) || (order == 'sell' && entry_type=='PE' &&  ordered == false) || (exchange=='MCX') ||(entry_type == undefined  && exchange == 'NSE' && order=='buy' && ordered == false)){
    console.log(ordered,"sets")
    const validUsers = []
    for (let i = 0; i < email.length; i++) {
        let valid = await Helper.getValidUsers(email[i], exchange, symbol)
        console.log(valid,"valid")
        if (valid) {
            validUsers.push(valid)
        }
        if(i == email.length - 1 && validUsers?.length > 0){
            ordered = true
        }
    }
    if(validUsers.length == 0){
        ordered = false
        res.status(200).json({
            message: "trades wont be placed, no valid user or instrument is not trading",
          });
    }
  
    if(ordered == true){
        const orderPlaced = []
        if (validUsers.length > 0) {
            for (let i = 0; i < validUsers.length; i++) {
                let placed = await Helper.placeAllUserOrders(validUsers[i], exchange, symbol, quantity)
                if(placed){
                    console.log (placed,"inplaced")
                    orderPlaced.push(placed);
                }
            }
        }
        
        
        if(orderPlaced.length > 0 && orderPlaced[0]?.status != 'error'){
            const exit = await Helper.runTradingStopLoss(validUsers[0], lossPrice, exits)
        }
        else{
            ordered = false
            res.status(200).json({
                message: orderPlaced[0]?.message,
              });
        }
       
        const exitmails = []
    
       async function exits(){
        console.log(orderPlaced,"placed orders")
            for (let i = 0; i < orderPlaced.length; i++) {
            let valid =  await Helper.exitAllUserOrders(validUsers[i], exchange, symbol,quantity)
                if(valid){
                    console.log(orderPlaced[i],"get data")
                    exitmails.push(orderPlaced[i])
                }
                console.log(ordered,"ordered")
                if(i == orderPlaced.length - 1){
                    ordered = false
                }
         } 
         res.status(200).json({
            message: "trades executed successfully",
            users: exitmails
          });
        }
    }
    
} else{
    console.log('trade in place already, cannot execute')
    res.status(200).json({
        message: "trades cannot be executed",
      });
 }
}