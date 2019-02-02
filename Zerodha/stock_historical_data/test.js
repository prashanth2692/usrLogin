var MongoClient = require('mongodb').MongoClient;

const getHistoricals = require('./archive_stock_data')

const zInstrumets = require('./zerodha_instrument_tokens.json')

var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  // dbConnection = db.db("MoneyControl");
  // dbConnection = dbo
  console.log("Database connection created!");
  // db.close();

  zInstrumets.forEach(instrumentBag => {
    instrumentBag.items.forEach(instrument => {
      
      let collectionName = `zerodha_${instrument.tradingsymbol}_day`
      getHistoricals(instrument.instrument_token, db, collectionName)
    })
  })
  // db.close()
});
