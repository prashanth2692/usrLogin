//@ts-check
// This scrpt is used to update 'transactions' collection
// 'transactions' collections holds transactions from both Zerodha and ICICI

const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")
const dbConstants = require('../helpers/dbConstants')
const ipoTxs = require('./ipo.js')
const moment = require('moment')


var url = "mongodb://localhost:27017/"
const JOB_NAME = 'updating_transactions_from_icici_zerodha'

createDBConnection(url)

function createDBConnection(url) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        console.log("Database created!");
        run(db)
    });
}

function run(db) {
    const mydb = db.db('mydb')
    const transactionsCollection = mydb.collection(dbConstants.collections.transactions)
    //for testing 
    // const transactionsCollection = mydb.collection(dbConstants.collections.testTransactions)

    const iciciTrxCollection = mydb.collection('ICICITransactions')
    const zerodhaTransactionsCollection = mydb.collection('ZerodhaTransactions')
    const logsCollection = mydb.collection('logs')
    const nseMapCollection = mydb.collection('nse_icici_symbol_map')

    let txCount = 0
    iciciTrxCollection.find({}).toArray((err, docs) => {
        if (err) throw err

        if (docs) {
            docs.forEach(doc => {
                let normalizedTx = new convertICICI(doc)
                normalizedTx.updated_date = new Date()

                nseMapCollection.findOne({ icici: normalizedTx.symbol }, (err, doc) => {
                    if (err) throw err

                    if (doc) {
                        normalizedTx.symbol = doc.nse
                        transactionsCollection.updateOne({ orderId: normalizedTx.orderId, settlement: normalizedTx.settlement },
                            { $set: normalizedTx, $setOnInsert: { created_date: new Date() } },
                            { upsert: true },
                            (err, iidoc) => {
                                if (err) throw err

                                txCount++
                                console.log(txCount, 'icici')

                                logsCollection.insertOne({
                                    jobName: JOB_NAME,
                                    status: 'success',
                                    message: `inserted icici transaction ${normalizedTx.orderId}`
                                })
                            })
                    } else {
                        logsCollection.insertOne({
                            jobName: JOB_NAME,
                            status: 'failure',
                            message: `couldn't inserted icici transaction ${normalizedTx.orderId}`
                        })
                    }
                })
            })
        }
    })

    zerodhaTransactionsCollection.find({}).toArray()
        .then((docs) => {
            // if (err) throw err

            if (docs) {
                docs.forEach(doc => {
                    let normalizedTx = new convertZerodha(doc)
                    normalizedTx['updated_date'] = (new Date())

                    // a given order can be executed in multiple trades
                    transactionsCollection.updateOne({ orderId: normalizedTx.orderId, tradeId: normalizedTx.tradeId },
                        { $set: normalizedTx, $setOnInsert: { created_date: new Date() } },
                        { upsert: true },
                        (err, iidoc) => {
                            if (err) throw err

                            txCount++
                            console.log(txCount, 'zerodha')

                            logsCollection.insertOne({
                                jobName: JOB_NAME,
                                status: 'success',
                                message: `inserted zerodha transaction ${normalizedTx.orderId}`
                            })
                        })
                })
            }
        })
        .catch(err => {
            console.log(err)
        })

    ipoTxs.forEach(tx => {
        tx.trade_date = tx.date.slice(0, 10)
        //@ts-ignore
        tx.date = new Date(tx.date)
        tx.updated_date = (new Date())
        transactionsCollection.updateOne({ broker: 'ipo', symbol: tx.symbol },
            { $set: tx, $setOnInsert: { created_date: new Date() } },
            { upsert: true },
            (err, iidoc) => {
                if (err) throw err

                txCount++
                console.log(txCount, 'ipo')

                logsCollection.insertOne({
                    jobName: JOB_NAME,
                    status: 'success',
                    message: `inserted ipo transaction ${tx.symbol}`
                })
            })
    })
}


function convertZerodha(zTx) {
    // smaple zerodha transaction record
    // {
    //     "_id": ObjectId("5c4c6ceaa3b0643e2888d469"),
    //     "Symbol": "YESBANK",
    //     "Exchange": "NSE",
    //     "Segment": "EQ",
    //     "Trade_Date": "2017-11-08",
    //     "Time": "2017-11-08T09:41:45",
    //     "Order_ID": "1300000000923518", // also mpas to normalizedTx.orderId
    //     "Trade_ID": "75340744",
    //     "Trade_Type": "buy",
    //     "Qty": 5,
    //     "Price": 310,
    //     "created_date": "Sat, 26 Jan 2019 14:21:30 GMT"
    // }

    this.broker = 'zerodha'
    this.symbol = zTx.Symbol
    this.exchange = zTx.Exchange
    // type: buy/sell
    this.type = zTx.Trade_Type
    this.segment = zTx.Segment
    this.dateTime = zTx.Time
    this.date = new Date(zTx.Trade_Date)
    this.trade_date = zTx.Trade_Date
    // orderId is common ofr both zerodha and icici
    // in zerodha a transaction is uniquely identified by order_id and trade_id combination
    // given given order can be executed in mutiple parts
    this.orderId = zTx.Order_ID
    this.tradeId = zTx.Trade_ID
    this.quantity = zTx.Qty
    this.price = zTx.Price
    this.zref_id = zTx._id
    // ref_id is common for both zerodha and icici
    this.ref_id = zTx._id
}


function convertICICI(iTx) {
    // sample icici transaction record
    // {
    //     "_id": ObjectId("5c4c40e23c81b637ec721976"),
    //     "Date": "13-Dec-2018",
    //     "Stock": "RAIIND",
    //     "Action": "Buy",
    //     "Qty": "71",
    //     "Price": "140.00",
    //     "Trade_Value": "9940.00",
    //     "Order_Ref": "20181213N100010316", // also mpas to normalizedTx.orderId
    //     "Settlement": "2018235",
    //     "Segment": "Rolling",
    //     "DP_Id - Client DP Id": "16014301-04701191",
    //     "Exchange": "NSE",
    //     "STT": "10.00",
    //     "Transaction_and SEBI Turnover charges": "0.30",
    //     "Stamp_Duty": "1.00",
    //     "Brokerage_+ Service Tax": "52.83",
    //     "Brokerage_incl": {
    //         " taxes": "64.1282"
    //     },
    //     "field17": "",
    //     "created_date": "Sat, 26 Jan 2019 11:13:38 GMT"
    // }

    // ger nse code from 'nse_icici_symbol_map' collection using icici code
    // let mydb = db.db('mydb')
    // let nseMapCollection = mydb.collection('nse_icici_symbol_map')

    // nseMapCollection.findOne({ icici: iTx.Stock }, (err, doc) => {
    //     if (err) throw err

    //     if (doc) {
    //         this.symbol = doc.nse
    //     }
    // })


    this.broker = 'icici_direct'
    this.symbol = iTx.Stock
    this.exchange = iTx.Exchange
    // type: buy/sell
    this.type = iTx.Action.toLowerCase()
    this.quantity = Number(iTx.Qty)
    this.date = new Date(iTx.Date)
    this.trade_date = new Date(iTx.Date).toISOString().slice(0, 10)
    this.price = Number(iTx.Price)
    this.order_ref = iTx.Order_Ref
    this.orderId = iTx.Order_Ref
    this.settlement = iTx.Settlement
    this.iref_id = iTx._id
    this.ref_id = iTx._id
    this.updated_date = new Date()
}