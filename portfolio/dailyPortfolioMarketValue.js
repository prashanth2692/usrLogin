//@ts-check

/**
 * This file is copied from dailyValue.js and changed to calculate daily market value of holdings
 * Comments need to be updated
 * Todo: check if dailyValue.jsrelated logic can be removed from this file 
 *       or dailyvalue.js be removed and the logic be handled here. 
 */

const dbConnection = require('../helpers/dbConnectionBase')
const logsFactory = require('../helpers/logsFactory')
const dbConts = require('../helpers/dbConstants')
const moment = require('moment')
const _ = require('underscore')
const JOB_NAME = 'calculate_daily_portfolio_value'
const logs = logsFactory(JOB_NAME)
const holdingsHelper = require('./holdingsHelper')
const path = require('path')

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
    const dayQuotesClx = mydb.collection(dbConts.collections.dailyQuotesNse_trial)

    // let transactions = await transactionClx.find({}).sort({ date: 1 }).toArray() // this returns promis
    // console.log(transactions.length)

    let firstTransaction = await transactionClx.find({}).sort({ date: 1 }).limit(1).toArray()
    let investmentStartDate = firstTransaction[0].date
    console.log(moment(investmentStartDate).format('YYYY-MM-DD'))

    // Get dates of transactions
    let transactionDates = await transactionClx.distinct('trade_date') // trade_date format YYYY-MM-DD
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
    let holdingsPerTradeDay = {}
    txsByDate.forEach((txList, index) => {
        // console.log(txByDate.length)
        let curDate = txList[txList.length - 1].trade_date
        // console.log(index, curDate)
        let holdings = holdingsHelper.calculateHoldings(holdingsHelper.groupTxByBroker(txList))
        let invesedAmount = holdings.reduce((total, current) => {
            return total + current.allocated_quantity * current.avgPrice
        }, 0)
        investedAmountObj[curDate] = invesedAmount
        holdingsPerTradeDay[curDate] = holdings
    })

    let currentDay // = firstTradeDay
    let currentHoldings // = holdingsPerTradeDay[currentDay]
    let portfolioValuePerDay = {}

    let transientTransactionDates = [...transactionDates] // way to copy by value a array
    console.log('started calculating daily market value')
    while (transientTransactionDates.length > 0) {
        // update current day and holdings, as new trading day is reached
        currentDay = transientTransactionDates.shift()
        currentHoldings = holdingsPerTradeDay[currentDay]

        // reduce array of holding stocks to object where key is symbol and value is quantity
        let currentHoldingsObj = currentHoldings.reduce((total, current) => {
            total[current.symbol] = current.allocated_quantity
            return total
        }, {})
        // if processing last traded day, next trade day is set to actual processing day(the day on which this script is run)
        let nextTradeDay = transientTransactionDates.length > 0 ? transientTransactionDates[0] : moment().format('YYYY-MM-DD')
        let stocksList = Object.keys(currentHoldingsObj)
        let previousDay
        while (currentDay < nextTradeDay) {
            console.log(`processing day ${currentDay}`)
            // currentDay holdigs will be previous traded day's holdings
            let stockQuotes = await dayQuotesClx.find({
                TIMESTAMP: currentDay,
                SERIES: 'EQ',
                SYMBOL: { $in: stocksList }
            }).toArray() // toArray returns a promise which can be awaited

            // calculate current day holdings value
            let dayValue = 0
            if (stockQuotes && stockQuotes.length > 0) {
                stockQuotes.forEach(quote => {
                    dayValue += Number(quote.CLOSE) * currentHoldingsObj[quote.SYMBOL]
                })
            } else {
                dayValue = previousDay ? (portfolioValuePerDay[previousDay] ? portfolioValuePerDay[previousDay] : 0) : 0
            }

            portfolioValuePerDay[currentDay] = dayValue

            // increment currentDay
            previousDay = currentDay
            currentDay = moment(currentDay, 'YYYY-MM-DD').add(1, 'd').format('YYYY-MM-DD')
        }
    }
    console.log(investedAmountObj)

    //writing to a file
    fs.writeFile('./dailyValue.json', JSON.stringify(investedAmountObj), (err) => {
        if (err) throw err

        console.log('written to file')
    })

    fs.writeFile(path.resolve(__dirname, 'dailyMarketValueOfHoldings.json'), JSON.stringify(portfolioValuePerDay), (err) => {
        if (err) throw err

        console.log('written daily market value to file')
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
