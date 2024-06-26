const WebSocket = require('ws');

exports.getDummy = (req,res,next) => {
    const socket = new WebSocket('wss://ws.bitstamp.net');
    const apiCall = {
    event: "bts:subscribe",
    data: { channel: "live_trades_btcusd"},
   };

    socket.onopen = () => {
        socket.send(JSON.stringify(apiCall));
      console.log('WebSocket connection opened');
    };

    let lastPrice = 0;
                    let startPrice = 0;
                    let stopLoss = 0;
                    let profit1, profit2, profit3;
                    let profit1Hit = false;
                    let profit2Hit = false;
                    let profit3Hit = false;
    socket.onmessage = (event) => {
        const result = JSON.parse(event.data);
        if (result?.data?.price) {
            if (startPrice == 0) {
                startPrice =  Number(result?.data?.price)
                lastPrice = Number(result?.data?.price) 
                stopLoss = Number(result?.data?.price) - 50
                profit1 = Number(result?.data?.price) + 40
                profit2 = Number(result?.data?.price) + 60
                profit3 = Number(result?.data?.price) + 80
                console.log(startPrice, "startPrice")
                console.log(lastPrice,"last")
            }
            if ( Number(result?.data?.price) > lastPrice && !profit1Hit) {
                lastPrice =  Number(result?.data?.price)
                stopLoss = result?.data?.price - 50
            } 
            console.log(Number(result?.data?.price),"current" )
            console.log(lastPrice,"last")
            console.log(stopLoss,"stop")

            if (Number(result?.data?.price) >= profit1  && Number(result?.data?.price) >= lastPrice && !profit2Hit && !profit3Hit) {
                lastPrice =  Number(result?.data?.price)
                stopLoss = Number(lastPrice) - 15
                profit1Hit = true;
                console.log(result?.data?.price, "in profit 1")
            }
            if (Number(result?.data?.price) >= profit2 &&  Number(result?.data?.price) >= lastPrice && !profit3Hit) {
                lastPrice =  Number(result?.data?.price)
                stopLoss = Number(lastPrice) - 20
                profit2Hit = true;
                console.log(result?.data?.price, "in profit 2")
            }
            if (Number(result?.data?.price) >= profit3 && Number(result?.data?.price) >= lastPrice) {
                lastPrice =  Number(result?.data?.price)
                stopLoss = Number(lastPrice) - 10
                profit3Hit = true;
                console.log(result?.data?.price, "in profit 3")
            }
            
            if (Number(result?.data?.price) <= stopLoss) {
                console.log(result?.data?.price,"----------------------------exited Trades---------------");
                socket.close()
                
                res.status(200).json({
                    message: `orders placed: exit`,
                });
            }
        }
    }
    socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
}