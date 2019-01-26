const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")

var url = "mongodb://localhost:27017/"
const JOB_NAME = 'zerodha_transaction_insert_to_db'

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
  let insertCount = 0
  let mydb = db.db('mydb')
  let zerodhaTransactionsCollection = mydb.collection('ZerodhaTransactions')
  const logsCollection = mydb.collection('logs')

  fs.readFile('./testTransactions.json', "utf-8", (err, data) => {
    let parsedData = JSON.parse(data)
    // console.log(parsedData)
    let flattenedData = _.flatten(parsedData)
    // console.log('total transacitons: ', flattenedData.length)

    logsCollection.insertOne({ jobName: JOB_NAME, status: 'started', created_date: (new Date()).toUTCString() })
    flattenedData.forEach(dataToInsert => {
      zerodhaTransactionsCollection.findOne({ Trade_ID: dataToInsert.Trade_ID }, (err, doc) => {
        if (err) {
          throw err
        }
        if (!doc) {
          dataToInsert.created_date = (new Date()).toUTCString()
          zerodhaTransactionsCollection.insertOne(dataToInsert, (err, idoc) => {
            if (err) {
              throw err
            }
            insertCount++
            console.log(insertCount, ' inserted transaction: ', dataToInsert.Trade_ID)
          })
        }
      })
    })

    logsCollection.insertOne({ jobName: JOB_NAME, status: 'completed', created_date: (new Date()).toUTCString() })

    // zerodhaTransactionsCollection.insertMany(flattenedData, (err, resp) => {
    //   if (err) {
    //     console.log(err)
    //   } else {
    //     console.log(resp)
    //   }

    //   db.close()
    // })
  })

}