// This scrpt is used to generate holdings report from transactions 

const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const _ = require("underscore")

var url = "mongodb://localhost:27017/"
const JOB_NAME = 'zerodha_holdings_report'

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
    let zerodhaTransactionsCollection = mydb.collection('ZerodhaTransactions')
    const holdingsObj = {}

    zerodhaTransactionsCollection.find({}).sort({ Symbol: 1, Time: 1 }).toArray((err, docs) => {
        if (err) throw err

        if (docs) {
            docs.forEach(doc => {
                if (holdingsObj[doc.Symbol]) {
                    let transactions = holdingsObj[doc.Symbol].transactions
                    if (doc.Trade_Type == 'buy') {
                        transactions.push(doc)

                    } else {
                        if (transactions.length > 0) {
                            sellStock(transactions, doc)
                        }
                    }
                } else {
                    holdingsObj[doc.Symbol] = {
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
        while (txObj.Qty > 0) {
            if (headTx.Qty > txObj.Qty) {
                headTx.Qty -= txObj.Qty
                txObj.Qty = 0
            } else {
                let temp = txs.shift()
                txObj.Qty -= temp.Qty
                headTx = txs[0]
            }
        }
    } else {
        return false
    }
}

function calculateAvgs(holdings) {
    printSeparator()
    console.log('symbol', 'qty', 'avg proce')
    for (let symbol in holdings) {
        let transactions = holdings[symbol].transactions
        let totalQty = 0
        let totalValue = 0

        if (transactions && transactions.length > 0) {
            transactions.forEach(tx => {
                totalQty += tx.Qty
                totalValue += tx.Qty * tx.Price
            })
        }

        if (totalQty > 0) {
            holdings[symbol].avgPrice = totalValue / totalQty
            console.log(symbol, totalQty, holdings[symbol].avgPrice.toFixed(2))
        } else {
        }
    }
}

function printSeparator() {
    console.log('---------------------------')
}