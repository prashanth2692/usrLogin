//@ts-check
const dbConnection = require('../helpers/dbConnectionBase')
const logsFactory = require('../helpers/logsFactory')
const dbConts = require('../helpers/dbConstants')
const moment = require('moment')
const _ = require('underscore')
const JOB_NAME = 'calculate_daily_portfolio_value'
const logs = logsFactory(JOB_NAME)

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

    // 1) get all transactions by date
    let transactionDates = await transactionClx.distinct('trade_date')
    transactionDates = _.sortBy(transactionDates)

    let transactionsByDate = await transactionClx.aggregate([{ $group: { _id: '$trade_date', txs: { $push: '$$ROOT' } } }]).sort({ _id: 1 }).toArray()
    console.log(transactionsByDate)
    // 2) generate holdings, for which daily value will be calculated
    // 3) start walking from the frist investment date
    // 4) when a transaction date is encountered, update holdings
    // 5) keep walking, if transaction date is envountered go to step 4
    // 6) if current date is encountered, stop
    db.close()
}
