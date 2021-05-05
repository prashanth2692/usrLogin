const moment = require("moment");
const fetch = require("node-fetch");

fetch("https://kite.zerodha.com/oms/instruments/historical/884737/day?user_id=YE1705&oi=1&from=2018-10-07&to=2020-04-07&ciqrandom=1617945495741", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "enctoken 8e7z77FrXK3P+3MrgwJdtm+Wd/PD1BYW9mIu0OJcsVCQK2zo253Fxi3XPy7VS1Sm5mqUkBS7sqzbrcBXZy4xEi5czBqy+w==",
    "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://kite.zerodha.com/static/build/chart.html?v=2.7.0",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}).then(response => response.json()).then(console.log);

function getStockDayQuotes(stockId, fromDate, toDate) {
  return new Promise((resolve, reject) => {
    fetch(`https://kite.zerodha.com/oms/instruments/historical/${stockId}/day?user_id=YE1705&oi=1&from=${fromDate}&to=${toDate}&ciqrandom=1617945495741`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "enctoken 8e7z77FrXK3P+3MrgwJdtm+Wd/PD1BYW9mIu0OJcsVCQK2zo253Fxi3XPy7VS1Sm5mqUkBS7sqzbrcBXZy4xEi5czBqy+w==",
        "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      },
      "referrer": "https://kite.zerodha.com/static/build/chart.html?v=2.7.0",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(response => response.json()).then(resolve);
  })
}

const URL_DATE_FORMAT = "YYYY-MM-DD"

async function run() {
  let fromDate = moment().subtract(1, 'y').format(URL_DATE_FORMAT)
  let toDate = moment().format(URL_DATE_FORMAT)
  const data = await getStockDayQuotes("884737", fromDate, toDate)
  console.log(data)
}

run()