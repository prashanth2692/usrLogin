//@ts-check
const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")
const momentTz = require('moment-timezone')
const assert = require('assert')
const dbConsts = require('../helpers/dbConstants')

var url = "mongodb://localhost:27017/"
const JOB_NAME = 'zerodha_transaction_insert_to_db'
const ZERODHA_TRANANSACTIONS = dbConsts.collections.ZerodhaTransactions

// createDBConnection(url)

function createDBConnection(url) {
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
    if (err) throw err;

    console.log("Database connection created!");
    let mydb = db.db('mydb')
    // if collection doesn't exists, create one
    let colxs = mydb.listCollections({ name: ZERODHA_TRANANSACTIONS })
    if (colxs.hasNext()) {
      insertTxs(db)
    } else {
      console.log('collection deosn\'t exists')
      mydb.createCollection(ZERODHA_TRANANSACTIONS).then(result => {
        console.log('created collection!')
        assert.equal(result.collectionName, ZERODHA_TRANANSACTIONS)

        insertTxs(db)

      })
    }
    // run(db)
  });

}

function insertTxs(mydb) {
  return new Promise((resolve, reject) => {
    // let mydb = db.db('mydb')

    let zerodhaTransactionsCollection = mydb.collection(ZERODHA_TRANANSACTIONS)
    const logsCollection = mydb.collection('logs')
    fs.readFile('./testTransactions.json', "utf-8", (err, data) => {
      let parsedData = JSON.parse(data)
      // console.log(parsedData)
      let flattenedData = _.flatten(parsedData)
      // console.log('total transacitons: ', flattenedData.length)

      logsCollection.insertOne({ jobName: JOB_NAME, status: 'started', created_date: new Date() })

      let insertCount = 0
      let noChangeCount = 0
      flattenedData.forEach(dataToInsert => {
        // zerodhaTransactionsCollection.findOne({ Trade_ID: dataToInsert.Trade_ID, Order_ID: dataToInsert.Order_ID }, (err, doc) => {
        zerodhaTransactionsCollection.findOne({ _id: dataToInsert.Trade_ID }, (err, doc) => {
          if (err) {
            // throw err
            console.log(err.message)
            return
          }
          if (!doc) {
            dataToInsert.created_date = new Date() // momentTz().tz('asia/calcutta').format("YY-MM-DD HH:mm:ss")
            dataToInsert._id = dataToInsert.Trade_ID
            zerodhaTransactionsCollection.insertOne(dataToInsert, (err, idoc) => {
              if (err) {
                // throw err
                console.log(err.message)
                return
              }
              insertCount++
              console.log(insertCount, ' inserted transaction: ', dataToInsert.Trade_ID)
              if (noChangeCount + insertCount == flattenedData.length) {
                logsCollection.insertOne({ jobName: JOB_NAME, status: 'completed', created_date: new Date() })
                // db.close()
                resolve()
              }
            })
          } else {
            noChangeCount++
            console.log(noChangeCount, ' existing transaction: ', dataToInsert.Trade_ID)
          }

          if (noChangeCount + insertCount == flattenedData.length) {
            logsCollection.insertOne({ jobName: JOB_NAME, status: 'completed', created_date: new Date() })
            // db.close()
            resolve()
          }
        })

      })

      // dataToInsert.updated_date = new Date()
      // zerodhaTransactionsCollection.updateOne({ _id: dataToInsert.Trade_ID },
      //   { $set: dataToInsert, $setOnInsert: { created_date: new Date() } },
      //   { upset: true },
      //   // node-mongo doesn't implecitly create a collection with updateOne
      //   // zerodhaTransactionsCollection.insertOne(dataToInsert,
      //   (err, iidoc) => {
      //     if (err) throw err

      //     insertCount++
      //     console.log(insertCount, ' inserted/updated transaction: ', dataToInsert.Trade_ID)
      //     if (flattenedData.length == insertCount) {
      //       logsCollection.insertOne({ jobName: JOB_NAME, status: 'completed', created_date: new Date() }).then(() => {
      //         console.log('closing connection')
      //         db.close()
      //       })
      //     }
      //   })
    })


  })
}

module.exports = insertTxs