const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")

var url = "mongodb://localhost:27017/"

createDBConnection(url)

function createDBConnection(url) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    console.log("Database created!");
    // db.close();

    // run(db.db('mydb'))
    // db.close()
    run(db)
  });

}


function run(db) {
  let mydb = db.db('mydb')
  let zerodhaTransactionsCollection = mydb.collection('ZerodhaTransactions');

  fs.readFile('./testTransactions.json', "utf-8", (err, data) => {
    let parsedData = JSON.parse(data)
    // console.log(parsedData)
    let flattenedData = _.flatten(parsedData)
    console.log('total transacitons: ', flattenedData.length)

    zerodhaTransactionsCollection.insertMany(flattenedData, (err, resp) => {
      if (err) {
        console.log(err)
      } else {
        console.log(resp)
      }

      db.close()
    })
  })

}