// This scrpt is used to generate holdings report from transactions 

const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")
const columnify = require('columnify')

var url = "mongodb://localhost:27017/"
const JOB_NAME = 'zerodha_holdings_report'
const dbConstants = require('../helpers/dbConstants')

createDBConnection(url)

function createDBConnection(url) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        console.log("Database created!");
        run(db)
    });
}

function run(db) {
    let mydb = db.db('mydb')
    let transactionsCollection = mydb.collection(dbConstants.collections.transactions)
    const holdingsObj = {}

    // transactionsCollection.find({}).sort({ symbol: 1, date: 1 }).toArray((err, docs) => {
    transactionsCollection.find({}, {
        sort: [
            ['symbol', 'asc'],
            ['date', 'asc']
        ]
    }).toArray((err, docs) => {
        if (err) throw err

        if (docs) {
            docs.forEach(doc => {
                // if (doc.symbol == 'HDFCLIFE') {
                //     console.log('HDFCLIFE', doc.type, doc.quantity, doc.price)
                // }
                if (holdingsObj[doc.symbol]) {
                    let transactions = holdingsObj[doc.symbol].transactions
                    if (doc.type == 'buy') {
                        transactions.push(doc)

                    } else {
                        if (transactions.length > 0) {
                            sellStock(transactions, doc)
                        }
                    }
                } else {
                    holdingsObj[doc.symbol] = {
                        transactions: [doc],
                        avgPrice: 0
                    }
                }
            })

            calculateAvgs(holdingsObj)
        }

        db.close()
    })
}

// takes time sorted array of buy transactions and 
// proceesses sell by modifying the given array
function sellStock(txs, txObj) {
    if (txs && txs.length > 0) {
        let headTx = txs[0]
        // console.log('debug', txObj.symbol)
        while (txObj.quantity > 0) {
            if (headTx.quantity > txObj.quantity) {
                headTx.quantity -= txObj.quantity
                txObj.quantity = 0
            } else {
                let temp = txs.shift()
                txObj.quantity -= temp.quantity
                headTx = txs[0]
            }
        }
    } else {
        return false
    }
}

function calculateAvgs(holdings) {
    printSeparator()
    let columnsToPrint = []
    // console.log('symbol', 'qty', 'avg proce')
    for (let symbol in holdings) {


        let transactions = holdings[symbol].transactions
        let totalQty = 0
        let totalValue = 0

        if (transactions && transactions.length > 0) {

            transactions.forEach(tx => {
                totalQty += tx.quantity
                totalValue += tx.quantity * tx.price
            })
        }

        if (totalQty > 0) {
            holdings[symbol].avgPrice = totalValue / totalQty
            columnsToPrint.push({
                symbol,
                totalQty,
                avgPrice: holdings[symbol].avgPrice.toFixed(2),
                totalValue: Number(totalValue.toFixed(2))
            })
            // console.log(symbol, totalQty, holdings[symbol].avgPrice.toFixed(2))
        } else {
        }
    }

    let aggrigateObj = columnsToPrint.reduce((prev, curr) => {
        if (prev) {
            return {
                symbol: 'total',
                totalQty: prev.totalQty + curr.totalQty,
                totalValue: prev.totalValue + curr.totalValue //this is supposed to be total value
            }
        }
    })
    columnsToPrint = _.sortBy(columnsToPrint, 'symbol')
    columnsToPrint.push(aggrigateObj)
    let columns = columnify(columnsToPrint,
        {
            // paddingChr: '.', 
            columnSplitter: ' | '
        }
    )
    console.log(columns)
}

function printSeparator() {
    console.log('---------------------------')
}