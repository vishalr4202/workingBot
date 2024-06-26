const WebSocket = require('ws');

exports.BTCIndicator = (req,res,next) => {
    const socket = new WebSocket('wss://ws.bitstamp.net');
    const apiCall = {
    event: "bts:subscribe",
    data: { channel: "live_trades_btcusd"},
   };
 
   const closingPrices = [];
const gainValues = [];
const lossValues = [];
const highPrices = [];
const lowPrices = [];

const period = 14; // RSI period length
const ema12Period = 12; // EMA period for 12-day EMA in MACD
const ema26Period = 26; // EMA period for 26-day EMA in MACD

let ema12 = 0;
let ema26 = 0;
let macdLine = 0;
let signalLine = 0;
let macdHistogram = 0;

const rsiBuyThreshold = 80;
const macdHistogramBuyThreshold = 0; // Example: Buy if MACD Histogram is above 0
const stochasticKBuyThreshold = 20; // Example: Buy if %K of Stochastic is below 20 
let generalRSI = 0

   function calculateRSI() {
    if (closingPrices.length < period + 1) {
      // Not enough data points to calculate RSI
      return;
    }
  
    // Calculate gains and losses
    for (let i = 1; i < closingPrices.length; i++) {
      const priceDiff = closingPrices[i] - closingPrices[i - 1];
      if (priceDiff > 0) {
        gainValues.push(priceDiff);
        lossValues.push(0);
      } else {
        gainValues.push(0);
        lossValues.push(-priceDiff);
      }
    }
  
    // Calculate average gain and average loss
    let avgGain = gainValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = lossValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
    for (let i = period; i < gainValues.length; i++) {
      avgGain = (avgGain * (period - 1) + gainValues[i]) / period;
      avgLoss = (avgLoss * (period - 1) + lossValues[i]) / period;
    }
  
    // Calculate RS and RSI
    const RS = avgGain / avgLoss;
    const RSI = 100 - (100 / (1 + RS));
    generalRSI = RSI.toFixed(2)
    console.log(`Current RSI: ${RSI.toFixed(2)}`);
  
    // Check if buy condition for RSI is met
    // if (RSI >  rsiBuyThreshold) {
    //   console.log("Buy Signal: RSI, MACD Histogram, and Stochastic indicate a buy!");
    //   // Execute your buy action here
    // }
  }

  function calculateEMA(period, previousEMA, currentPrice) {
    const multiplier = 2 / (period + 1);
    return (currentPrice - previousEMA) * multiplier + previousEMA;
  }

  function calculateMACD() {
    if (closingPrices.length < ema26Period) {
      // Not enough data points to calculate MACD
      return;
    }
  
    // Calculate EMA12
    ema12 = calculateEMA(ema12Period, ema12, closingPrices[closingPrices.length - 1]);
  
    // Calculate EMA26
    ema26 = calculateEMA(ema26Period, ema26, closingPrices[closingPrices.length - 1]);
  
    // Calculate MACD Line
    macdLine = ema12 - ema26;
  
    // Calculate Signal Line (9-period EMA of MACD Line)
    if (closingPrices.length >= ema26Period + 8) {
      if (signalLine === 0) {
        signalLine = macdLine; // Initial value for Signal Line
      } else {
        signalLine = calculateEMA(9, signalLine, macdLine);
      }
    }
  
    // Calculate MACD Histogram
    macdHistogram = macdLine - signalLine;
  
    console.log(`Current MACD Line: ${macdLine.toFixed(2)}`);
    console.log(`Current Signal Line: ${signalLine.toFixed(2)}`);
    console.log(`Current MACD Histogram: ${macdHistogram.toFixed(2)}`);
  
    // Check if buy condition for MACD Histogram is met
    if (generalRSI > rsiBuyThreshold && macdHistogram > macdHistogramBuyThreshold) {
      console.log("Buy Signal: RSI, MACD Histogram, indicate a buy!");
      // Execute your buy action here
    }
  }

    socket.onopen = () => {
        socket.send(JSON.stringify(apiCall));
      console.log('WebSocket connection opened');
    };
    
    socket.onmessage = (event) => {
        const result = JSON.parse(event.data);
        if (result?.data?.price) {
           console.log(result?.data?.price)
           closingPrices.push(result?.data?.price);
           calculateRSI();
           calculateMACD();
        }
    }
    socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
}