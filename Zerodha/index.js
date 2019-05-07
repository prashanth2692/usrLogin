/**
 * This file executes python script to process xml transaction files from zerodha
 * output of above script is a JSON,
 * which will be used by a nde script to insert data from JSON to mongo DB
 */


const pythonFromNode = require('../helpers/pythonFromNode.js')
const insertToDB = require('./insertTransactionsIntoMongo.js')
const consolidateTxs = require('../portfolio/consolidated_transactions.js')

async function run() {
  // Execute pyton script
  await pythonFromNode()
  console.log('---------------Python executed Successfullt-----------------')


  // continue inserting to DB

  var MongoClient = require('mongodb').MongoClient;

  // Connect to the db
  MongoClient.connect("mongodb://localhost:27017/mydb", async function (err, db) {
    if (!err) {
      console.log("MongoDB Connection established");
      let mydb = db.db('mydb')
      await insertToDB(mydb)

      await consolidateTxs(mydb)
      db.close()
    } else {
      throw err
    }
  });
}

run()