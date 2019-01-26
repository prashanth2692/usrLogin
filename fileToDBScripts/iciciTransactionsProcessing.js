const axios = require('axios')
const HTMLParser = require('node-html-parser');
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const path = require('path');

// const nseJsonArray = require('../ICICIDirect/output/NSE_EQUITY_L_ARRAY.json')

const csv = require('csvtojson')

console.log(__dirname)
//sample path: '../../../Stocks/portfolio/ICICI/8504526259_TradeBook_FY 2017-18.csv'
const pathToICICITransactions = '../../../Stocks/portfolio/ICICI/'
const requiedFiles = []
fs.readdir(path.join(__dirname, pathToICICITransactions), function (err, items) {
  // console.log(items);

  let tradeBookPattern = new RegExp('8504526259_TradeBook.*csv')

  for (var i = 0; i < items.length; i++) {
    if (items[i].match(tradeBookPattern)) {
      console.log(items[i]);
      requiedFiles.push(items[i])
    }
  }
});

// Initialize the connection as a promise:
const uri = 'mongodb://localhost:27017/'
MongoClient.connect(uri, function (err, db) {
  if (err) throw err;

  // name of the DB to use is: "mydb"
  // dbConnection = dbo
  console.log("Database created!");
  // db.close();
  // doSomeWork(mydb, db)

  processTransactions(db)
});


// important: this is the column uniquely identifying the row
const Order_Ref = 'Order_Ref'
let insertCount = 0
function processTransactions(db) {
  if (requiedFiles.length > 0) {

    const mydb = db.db('mydb')
    const iciciTrxCollection = mydb.collection('ICICITransactions')

    requiedFiles.forEach(fileName => {
      csv().fromFile(path.join(__dirname, pathToICICITransactions, fileName)).then((result) => {
        // console.log(result)
        const nameToKeyMap = {}
        for (let key in result[0]) {
          nameToKeyMap[key] = key.replace(' ', '_')
          // console.log(key, key.replace(' ', '_'))
        }

        result.forEach(trx => {
          const tempTrx = {}
          for (let keyName in trx) {
            // console.log(key, key.split(' ').join('_')) or key.replace(' ', '_')
            if (keyName === 'Order Ref') {
              tempTrx[nameToKeyMap[keyName]] = trx[keyName]['']
            } else {
              tempTrx[nameToKeyMap[keyName]] = trx[keyName]
            }
          }
          tempTrx.created_date = (new Date()).toUTCString()

          iciciTrxCollection.findOne({ Order_Ref: tempTrx[Order_Ref] }, (err, doc) => {
            if (err) {
              console.log(err)
            } else {
              if (!doc) {
                // console.log(tempTrx[Order_Ref])
                iciciTrxCollection.insertOne(tempTrx, (er, resp) => {
                  if (err) {
                    throw err
                  }
                  insertCount++
                  console.log(insertCount)
                  // db.close()
                })
              } else {
                // console.log('already inserted: ' )
              }
            }
          })

        })
      }).catch((err) => {
        console.log(err)
        db.close()
      });

    })
    // db.close()
  } else {
    db.close()
  }
}

