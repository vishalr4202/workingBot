const fs = require("fs");

const saveData = (data, file, callback) => {
  const path = "../config.json";
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile(path, jsonData, callback);
};

const readData = (callback) => {
  const path = "../config.json";
  fs.readFile(path, "utf-8", (err, jsonString) => {
    if (err) {
      callback(err, null);
    } else {
      try {
        const data = JSON.parse(jsonString);
        if (checkifUserLoggedIn(data)) {
          callback(null, data);
        } else {
          callback("Please login to Firstock", null);
        }
      } catch (error) {
        callback(error, null);
      }
    }
  });
};

const checkifUserLoggedIn = ({ userId, token }) => {
  if (!userId || !token) {
    return false;
  }

  return true;
};

const validateBasketMarginObject = (data) => {
  if (
    data["exchange"] &&
    data["tradingSymbol"] &&
    data["quantity"] &&
    data["transactionType"]
  ) {
    return true;
  }
  return false;
};

const validateBasketMargin = (data) => {
  return data.every((a) => validateBasketMarginObject(a));
};

const handleError = (error) => {
  if (error) {
    if (error.response) {
      if (error.response.data) {
        return error.response.data;
      } else {
        return error.response;
      }
    } else {
      return error;
    }
  }
  return "error";
};

const handleNewError = (error) => {
  if (error) {
    if (error.response) {
      if (error.response.data.detail.length>0) {
        console.log(error,"in common")
        console.log(error.response.data)
      return {message: `${error.response.data.detail[0].loc[1]} is missing`,status:error.response.status}
    
  }
}
  }
}

module.exports = {
  saveData,
  readData,
  validateBasketMarginObject,
  validateBasketMargin,
  handleError,
  handleNewError
};
