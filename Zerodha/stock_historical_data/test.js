var MongoClient = require('mongodb').MongoClient;

const getHistoricals = require('./archive_stock_data')

var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  // dbConnection = db.db("MoneyControl");
  // dbConnection = dbo
  console.log("Database connection created!");
  // db.close();

  getHistoricals(107265, db)
  // db.close()
});
