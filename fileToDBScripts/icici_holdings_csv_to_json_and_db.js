const axios = require('axios')
const HTMLParser = require('node-html-parser');
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const path = require('path');

// const nseJsonArray = require('../ICICIDirect/output/NSE_EQUITY_L_ARRAY.json')

const csv = require('csvtojson')

// console.log(__dirname)
//sample path: '../../../Stocks/portfolio/ICICI/8504526259_Demat_FY 2017-18.csv'
const pathToICICITransactions = '../../../Stocks/portfolio/ICICI/'
const requiedFiles = []
fs.readdir(path.join(__dirname, pathToICICITransactions), function (err, items) {
    let dematPattern = new RegExp('8504526259_Demat.*csv')

    for (var i = 0; i < items.length; i++) {
        if (items[i].match(dematPattern)) {
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

    processHoldings(db)
});



function processHoldings(db) {
    const mydb = db.db('mydb')
    const staticIciciHoldings = mydb.collection('staticIciciHoldings')

    requiedFiles.forEach(fileName => {
        let match = fileName.match(/\d[0-9\-]*\d$/)
        let holdingsDate
        if (match && match.length > 0) {
            holdingsDate = match[0]
        }
        csv().fromFile(path.join(__dirname, pathToICICITransactions, fileName))
            .then((result) => {
                // console.log(result)
                let insertCount = 0
                const nameToKeyMap = {}
                for (let key in result[0]) {
                    nameToKeyMap[key] = key.replace(' ', '_')
                    // console.log(key, key.replace(' ', '_'))
                }

                result.forEach(trx => {
                    const tempHolding = {}
                    for (let keyName in trx) {
                        // console.log(key, key.split(' ').join('_')) or key.replace(' ', '_')
                        if (keyName === 'Order Ref') {
                            tempHolding[nameToKeyMap[keyName]] = trx[keyName]['']
                        } else {
                            tempHolding[nameToKeyMap[keyName]] = trx[keyName]
                        }
                    }
                    tempHolding.created_date = (new Date()).toUTCString()

                    // date on which the holdings snapshot is taken
                    tempHolding.holdingsDate = holdingsDate

                    staticIciciHoldings.findOne({ holdingsDate: holdingsDate, ISIN: tempHolding.ISIN }, (err, doc) => {
                        if (err) {
                            console.log(err)
                        } else {
                            if (!doc) {
                                staticIciciHoldings.insertOne(tempHolding, (er, resp) => {
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
            })
    })
}