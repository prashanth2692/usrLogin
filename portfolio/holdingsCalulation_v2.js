//@ts-check
var MongoClient = require('mongodb').MongoClient;
const dbConstants = require('./../helpers/dbConstants')
const moment = require('moment')

const holdingsHelper = require('./holdingsHelper')

// var url = "mongodb://localhost:27017/"

// MongoClient.connect(url, function (err, db) {
//   if (err) {
//     // res.status(500).send(err.message)
//     return
//   };
//   run(db)
// })

function run(db, uid, returnOnlyPast) {
  let promise = new Promise((resolve, reject) => {
    const mydb = db.db('mydb')
    const txClx = mydb.collection(dbConstants.collections.transactions)

    let txByBroker = {
      "icici_direct": {
        allTxs: []
      },
      "zerodha": {
        allTxs: []
      }
    }

    txClx.aggregate([{ $match: { uid } }, { $group: { _id: '$broker', txs: { $push: '$$ROOT' } } }]
      , (err, aggregateCursor) => {

        aggregateCursor.each((err, result) => {
          if (result) {
            // cursor works even afte db.close() is called
            if (result._id == 'ipo') {
              txByBroker.zerodha.allTxs = txByBroker.zerodha.allTxs.concat(result.txs)
            } else if (result) {
              txByBroker[result._id].allTxs = txByBroker[result._id].allTxs.concat(result.txs)
            }
          }

          aggregateCursor.hasNext((err, hasNext) => {
            if (!hasNext) {
              // no more elements for the cursor to iterate 
              if (returnOnlyPast) {
                let holdings = holdingsHelper.calculatePastHoldings(txByBroker)
                resolve(holdings)
              } else {
                let holdings = holdingsHelper.calculateHoldings(txByBroker)
                resolve(holdings)
              }
            }
          })
        })
        db.close()
      }
    )
  })

  return promise
}

module.exports = run

// function calculateHoldings(txByBroker) {
//   let consolidatedHoldingsPerBorker = {
//     // 'zerodha': {},
//     // "icici_direct": {}
//   }
//   for (let broker in txByBroker) {
//     consolidatedHoldingsPerBorker[broker] = {}
//     txByBroker[broker].allTxs = groupTxBySymbolAndDate(txByBroker[broker].allTxs)

//     for (let symbol in txByBroker[broker].allTxs) {
//       for (let date in txByBroker[broker].allTxs[symbol]) {
//         txByBroker[broker].allTxs[symbol][date] = reduceToSingleTxType(txByBroker[broker].allTxs[symbol][date])
//       }

//       consolidatedHoldingsPerBorker[broker][symbol] = calculateAvgPrice(txByBroker[broker].allTxs[symbol])
//     }
//   }

//   CalculateOverallHoldings(consolidatedHoldingsPerBorker)

//   // console.log(txByBroker)



//   // calculate avg price of symbol per broker 
//   // for(let symbol in )
// }

// function groupTxBySymbolAndDate(txList) {
//   let retObj = {}

//   if (txList && txList.length > 0) {
//     txList.forEach(tx => {
//       if (retObj[tx.symbol]) {
//         let symbolTxs = retObj[tx.symbol]

//         if (symbolTxs[tx.trade_date]) {
//           symbolTxs[tx.trade_date].push(tx)
//         } else {
//           symbolTxs[tx.trade_date] = [tx]
//         }
//       } else {
//         retObj[tx.symbol] = {}
//         retObj[tx.symbol][tx.trade_date] = [tx]
//       }
//     })
//   }

//   return retObj
// }

// function reduceToSingleTxType(txs) {
//   // holds buy txs
//   let buyTxs = []
//   // holds sell txs
//   let sellTxs = []

//   if (txs.length < 2) {
//     // one or no txs, no need to normalize
//     return txs
//   } else {
//     txs.forEach((tx) => {
//       if (tx.type == 'buy') {
//         buyTxs.push(tx)
//         // effPrice = (effPrice * effQty + tx.quantity * tx.price) / (tx.quantity + effQty)
//         // effQty += tx.quantity
//       } else {
//         sellTxs.push(tx)
//       }
//     })

//     if (sellTxs.length > 0) {
//       if (buyTxs.length > 0) {
//         // both buy and sell transactions, accounts for intraday trading
//         while (sellTxs.length) {
//           let sellQty = sellTxs[0].quantity
//           while (sellQty > 0) {
//             // repeatedly copare against buy tx to reduce sell qty count
//             if (buyTxs.length > 0) {
//               let fstBuy = buyTxs[0]
//               if (fstBuy.quantity <= sellQty) {
//                 // if buy qty <= sell qty, remove buy transaction 
//                 // and reduce sell qty buy removed buy tx qty
//                 buyTxs.shift()
//                 sellQty -= fstBuy.quantity
//               } else {
//                 fstBuy.quantity -= sellQty
//                 sellQty = 0
//               }
//             } else {
//               // if no buy tx, break
//               break
//             }
//           }


//           if (sellQty == 0) {
//             // if current sell qty matches buy qty
//             // remove the sell tx
//             sellTxs.shift()
//           } else {
//             // no more buy transactions to normalize against
//             break
//           }
//         }

//         // return left over transaction
//         if (sellTxs.length == 0 && buyTxs.length == 0) {
//           // this means total intraday buy qty == sell qty
//           return []
//         } else if (sellTxs.length != 0) {
//           // this means total intraday buy qty < sell qty
//           return sellTxs
//         } else {
//           // this means total intraday buy qty > sell qty
//           return buyTxs
//         }
//       } else {
//         // only sell transaction on this day
//         return txs
//       }
//     } else {
//       // only buy transactions
//       return txs
//     }
//   }
// }

// function calculateAvgPrice(txsByDate) {
//   let dates = Object.keys(txsByDate)
//   dates.sort() // sorts dates in ascending order
//   // console.log(dates)

//   // let holding = {}
//   let buyTxs = []
//   let sellTxs = []
//   dates.forEach(date => {
//     if (txsByDate[date].length > 0) {
//       if (txsByDate[date][0].type == 'buy') {
//         buyTxs = buyTxs.concat(txsByDate[date])
//       } else {
//         sellTxs = sellTxs.concat(txsByDate[date])
//       }
//     }
//   })

//   // hoping, buy quantity is greater than sell quantity
//   while (sellTxs.length > 0) {
//     let sellTx = sellTxs[0]

//     while (sellTx.quantity > 0) {
//       if (buyTxs.length > 0) {
//         let buyTx = buyTxs[0]

//         if (sellTx.quantity > buyTx.quantity) {
//           buyTxs.shift()
//           sellTx.quantity -= buyTx.quantity
//         } else if (sellTx.quantity < buyTx.quantity) {
//           sellTxs.shift()
//           buyTx.quantity -= sellTx.quantity
//           // sellTx.quantity = 0 // to break out of while loop
//           break
//         } else {
//           sellTxs.shift()
//           buyTxs.shift()
//           break
//         }
//       } else {
//         // no buy transactions to match against
//         break
//       }
//     }
//   }

//   // hopefully, only buy txs should be left
//   let tempTx = txsByDate[dates[0]][0]
//   console.log(tempTx.broker, tempTx.symbol, `buy qty: ${buyTxs.length}, sell qty:${sellTxs.length}`)

//   let avgPrice = 0
//   let totalQty = 0
//   if (buyTxs.length > 0) {
//     buyTxs.forEach(bt => {
//       avgPrice = (avgPrice * totalQty + bt.price * bt.quantity) / (totalQty + bt.quantity)
//       totalQty += bt.quantity
//     })
//   }
//   console.log(tempTx.broker, tempTx.symbol, `total Qty: ${totalQty}, avg price: ${avgPrice}`)

//   return {
//     totalQty,
//     avgPrice
//   }

// }


// function CalculateOverallHoldings(holdingsPerBroker) {
//   let brokers = Object.keys(holdingsPerBroker)
//   let finalHoldings = {}

//   brokers.forEach(broker => {
//     for (let symbol in holdingsPerBroker[broker]) {
//       if (finalHoldings[symbol]) {
//         let symHolding = finalHoldings[symbol]
//         let currHolding = holdingsPerBroker[broker][symbol]

//         symHolding.avgPrice = (symHolding.avgPrice * symHolding.totalQty + currHolding.avgPrice * currHolding.totalQty) / (symHolding.totalQty + currHolding.totalQty)
//         symHolding.totalQty = symHolding.totalQty + currHolding.totalQty
//       } else {
//         finalHoldings[symbol] = holdingsPerBroker[broker][symbol]
//       }
//     }
//     console.log(`\n---------${broker}-----------`)
//     pretyPrintHoldings(holdingsPerBroker[broker])
//   })

//   console.log(`\n---------overall-----------`)
//   pretyPrintHoldings(finalHoldings)

// }


// function pretyPrintHoldings(holdings) {
//   // prety printing
//   let columnsToPrint = []
//   for (let symbol in holdings) {
//     columnsToPrint.push({
//       symbol,
//       quantity: holdings[symbol].totalQty,
//       price: holdings[symbol].avgPrice.toFixed(2)
//     })

//   }

//   columnsToPrint = _.sortBy(columnsToPrint, 'symbol')

//   let columns = columnify(columnsToPrint,
//     {
//       columnSplitter: ' | '
//     }
//   )
//   console.log(columns)
// }