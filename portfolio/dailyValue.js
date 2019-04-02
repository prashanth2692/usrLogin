//@ts-check
const dbConnection = require('../helpers/dbConnectionBase')
const logsFactory = require('../helpers/logsFactory')
const dbConts = require('../helpers/dbConstants')
const moment = require('moment')
const _ = require('underscore')
const JOB_NAME = 'calculate_daily_portfolio_value'
const logs = logsFactory(JOB_NAME)
const holdingsHelper = require('./holdingsHelper')

const fs = require('fs')

dbConnection.then(db => {
    console.log('received connection!')
    run(db)
    // db.close()
}).catch(err => {
    console.log(err)
})

/**
 * strategy:
 * 1) get all transaction dates
 * 2) generate holdings, for which daily value will be calculated
 * 3) start walking from the frist investment date
 * 4) when a transaction date is encountered, update holdings
 * 5) keep walking, if transaction date is envountered go to step 4
 * 6) if current date is encountered, stop
 * @param {*} db 
 */
async function run(db) {
    const mydb = db.db('mydb')
    const transactionClx = mydb.collection(dbConts.collections.transactions)

    // let transactions = await transactionClx.find({}).sort({ date: 1 }).toArray() // this returns promis
    // console.log(transactions.length)

    let firstTransaction = await transactionClx.find({}).sort({ date: 1 }).limit(1).toArray()
    let investmentStartDate = firstTransaction[0].date
    console.log(moment(investmentStartDate).format('YYYY-MM-DD'))

    // Get dates of transactions
    let transactionDates = await transactionClx.distinct('trade_date')
    transactionDates = _.sortBy(transactionDates)
    console.log(transactionDates.length)

    // forEach loop doens't wait for all async furntion to resolve
    // Execution will move furthur without waiting for the all async to resolve
    // transactionDates.forEach(async date => {
    //     let txs = await transactionClx.find({ 'trade_date': { $lte: date } }).sort({date: 1}).toArray()
    //     console.log(txs.length)
    // });

    // below code will execute awaits sequentially
    // i.e., only after a await is resolved, the loop proceedes with next iteration 
    // for (const date of transactionDates) {
    //     let txs = await transactionClx.find({ 'trade_date': { $lte: date } }).sort({date: 1}).toArray()
    // }

    let promises = transactionDates.map(date => {
        return transactionClx.find({ 'trade_date': { $lte: date } }).sort({ date: 1 }).toArray()
    })

    let txsByDate = await Promise.all(promises)

    // let count = 1
    let investedAmountObj = {}
    txsByDate.forEach((txList, index) => {
        // console.log(txByDate.length)
        let curDate = txList[txList.length - 1].trade_date
        console.log(index, curDate)
        let holdings = holdingsHelper.calculateHoldings(holdingsHelper.groupTxByBroker(txList))
        let invesedAmount = holdings.reduce((total, current) => {
            return total + current.allocated_quantity * current.avgPrice
        }, 0)
        investedAmountObj[curDate] = invesedAmount
    })

    console.log(investedAmountObj)

    //writing to a file
    fs.writeFile('./dailyValue.json', JSON.stringify(investedAmountObj), (err) => {
        if (err) throw err

        console.log('written to file')
    })

    // let transactionsByDate = await transactionClx.aggregate([{ $group: { _id: '$trade_date', txs: { $push: '$$ROOT' } } }]).sort({ _id: 1 }).toArray()
    // console.log(transactionsByDate)
    // 1) get all transactions by date
    // 2) generate holdings, for which daily value will be calculated
    // 3) start walking from the frist investment date
    // 4) when a transaction date is encountered, update holdings
    // 5) keep walking, if transaction date is envountered go to step 4
    // 6) if current date is encountered, stop
    db.close()
}
