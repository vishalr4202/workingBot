const Firstock = require("thefirstock");
const firstock = new Firstock();
// const WebSocket = require("ws");

const ws = firstock.initializeWebSocket();
exports.getIndicator = (req,res,next) => {
    console.log('in')
const closingPrices = [];
const gainValues = [];
const lossValues = [];
const highPrices = [];
const lowPrices = [];

const period = 14; // RSI period length
const ema12Period = 12; // EMA period for 12-day EMA in MACD
const ema26Period = 26; // EMA period for 26-day EMA in MACD
const stochasticKPeriod = 14; // Stochastic %K period
const stochasticDPeriod = 3; // Stochastic %D period

let ema12 = 0;
let ema26 = 0;
let macdLine = 0;
let signalLine = 0;
let macdHistogram = 0;
let stochasticK = 0;
let stochasticD = 0;

// Define buy condition thresholds
const rsiBuyThreshold = 30; // Example: Buy if RSI is below 30
const macdHistogramBuyThreshold = 0; // Example: Buy if MACD Histogram is above 0
const stochasticKBuyThreshold = 20; // Example: Buy if %K of Stochastic is below 20

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

  console.log(`Current RSI: ${RSI.toFixed(2)}`);

  // Check if buy condition for RSI is met
  if (RSI < rsiBuyThreshold && macdHistogram > macdHistogramBuyThreshold && stochasticK < stochasticKBuyThreshold) {
    console.log("Buy Signal: RSI, MACD Histogram, and Stochastic indicate a buy!");
    // Execute your buy action here
  }
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
  if (RSI < rsiBuyThreshold && macdHistogram > macdHistogramBuyThreshold && stochasticK < stochasticKBuyThreshold) {
    console.log("Buy Signal: RSI, MACD Histogram, and Stochastic indicate a buy!");
    // Execute your buy action here
  }
}

function calculateStochastic() {
  if (closingPrices.length < stochasticKPeriod) {
    // Not enough data points to calculate Stochastic
    return;
  }

  // Track highest high and lowest low prices
  highPrices.push(Math.max(...closingPrices.slice(closingPrices.length - stochasticKPeriod)));
  lowPrices.push(Math.min(...closingPrices.slice(closingPrices.length - stochasticKPeriod)));

  // Ensure arrays are within length limits
  if (highPrices.length > stochasticKPeriod) {
    highPrices.shift(); // Remove oldest entry
  }
  if (lowPrices.length > stochasticKPeriod) {
    lowPrices.shift(); // Remove oldest entry
  }

  // Calculate %K
  const currentClose = closingPrices[closingPrices.length - 1];
  const highestHigh = Math.max(...highPrices);
  const lowestLow = Math.min(...lowPrices);
  stochasticK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // Calculate %D (3-period SMA of %K)
  if (closingPrices.length >= stochasticKPeriod + stochasticDPeriod - 1) {
    const sumK = stochasticK + (stochasticK - stochasticKPeriod + stochasticDPeriod - 1);
    stochasticD = sumK / stochasticDPeriod;
  }

  console.log(`Current %K: ${stochasticK.toFixed(2)}`);
  console.log(`Current %D: ${stochasticD.toFixed(2)}`);

  // Check if buy condition for Stochastic is met
  if (RSI < rsiBuyThreshold && macdHistogram > macdHistogramBuyThreshold && stochasticK < stochasticKBuyThreshold) {
    console.log("Buy Signal: RSI, MACD Histogram, and Stochastic indicate a buy!");
    // Execute your buy action here
  }
}

ws.on("open", function open() {
  firstock.getWebSocketDetails({ UID: 'MA0591', jKey: '92145c5bd12d205edd2507c7a9a1009e2a5ec6fb3aa512011d52dce7391320e5' },(err, result) => {
    if (!err) {
        console.log('in here')
      firstock.initialSendWebSocketDetails(ws, result, () => {
        ws.send(firstock.subscribeFeed("NSE|26000"));
      });
    }
  });
});

ws.on("error", function error(error) {
  console.log(`WebSocket error: ${error}`);
});

ws.on("message", function message(data) {
  const result = firstock.receiveWebSocketDetails(data);
  
  // Assuming result contains a field for the current price or tick data
  const currentPrice = result.currentPrice; // Adjust this based on your data structure
console.log(currentPrice?.lp)
  // Store closing price
  closingPrices.push(currentPrice?.lp);

  // Calculate RSI
  calculateRSI();

  // Calculate MACD
  calculateMACD();

  // Calculate Stochastic
  calculateStochastic();
});
}