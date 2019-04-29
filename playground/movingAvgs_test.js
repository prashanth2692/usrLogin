//@ts-check
const dbConnection = require('../helpers/dbConnectionBase')
const logsFactory = require('../helpers/logsFactory')
const dbConts = require('../helpers/dbConstants')
const moment = require('moment')
const _ = require('underscore')
const JOB_NAME = 'calculate_daily_portfolio_value'
const logs = logsFactory(JOB_NAME)
// const holdingsHelper = require('./holdingsHelper')
const path = require('path')

const fs = require('fs')

dbConnection.then(db => {
  console.log('received connection!')
  run(db)
  // db.close()
}).catch(err => {
  console.log(err)
})

async function run(db) {
  const days = 50
  let mydb = db.db('mydb')
  let symbol = 'HDFCLIFE'
  let dayQuoteClx = mydb.collection(dbConts.collections.dailyQuotesNse_trial)

  let fetchTimerLabel = `fetch_records_for_${symbol}`
  console.time(fetchTimerLabel)
  let quotes = await dayQuoteClx.find({ SYMBOL: symbol, SERIES: 'EQ' })
    .sort({ TIMESTAMP: 1 }).toArray()

  console.timeEnd(fetchTimerLabel)

  db.close()

  console.log(`Total ${quotes.length} days of trading`)

  let ma50 = calculateMA(quotes, 50)
  let ma14 = calculateMA(quotes, 14)
  let ma7 = calculateMA(quotes, 7)
  console.log(`length full:${quotes.length} 50:${Object.keys(ma50).length} 14:${Object.keys(ma14).length} 7:${Object.keys(ma7).length}`)
  backTest(quotes, ma14, ma7)

}

/**
 * calculates moving average of given number of days
 * @param {*} quotes 
 * @param {number} days 
 */
function calculateMA(quotes, days) {
  if (!quotes || quotes.length < days) {
    return false
  }

  // The slice() method returns a shallow copy of a portion of an array into 
  // a new array object selected from begin to end (end not included). 
  // The original array will not be modified.
  // let initialNoOfDays = quotes.slice(0, 50)

  let currentLeftIndex = 0
  let currentRightIndex = days - 1
  let sum = 0

  let calculateMATimerLabel = `calculating_${days}_day_MA`
  console.time(calculateMATimerLabel)
  let movingAvgs = {}
  while (currentRightIndex < quotes.length) {
    // console.log(quotes[currentRightIndex].TIMESTAMP)
    if (sum == 0) {
      // ionitially calculate sum from all quotes
      sum = calculateSum(quotes, currentLeftIndex, currentRightIndex)
    } else {
      // subsequently, calculate sum by substracting previous day and adding current right day
      sum = sum - Number(quotes[currentLeftIndex - 1].CLOSE) + Number(quotes[currentRightIndex].CLOSE)
    }
    let avg = sum / days

    movingAvgs[quotes[currentRightIndex].TIMESTAMP] = avg


    // update indexes
    currentLeftIndex++
    currentRightIndex++
  }

  console.timeEnd(calculateMATimerLabel)
  // console.log(movingAvgs)

  return movingAvgs
}

/**
 * calculate sum of closes of given quotes from leftIndex to rightIndex
 * @param {*} quotes 
 * @param {*} leftIndex 
 * @param {*} rightIndex 
 */
function calculateSum(quotes, leftIndex, rightIndex) {
  let sum = 0

  for (let i = leftIndex; i < rightIndex; i++) {
    sum += Number(quotes[i].CLOSE)
  }

  return sum
}

/**
 * Back tests mpving average cross ove strategy
 * @param {*} quotes 
 * @param {*} ma14 
 * @param {*} ma7 
 */
function backTest(quotes, ma14, ma7) {
  let startIndex = 13
  let bought = false
  let ma14Array = Object.keys(ma14).map(date => {
    return { date, value: ma14[date] }
  })
  let ma7Array = Object.keys(ma7).map(date => {
    return { date, value: ma7[date] }
  })
  // start walk
  let maIndex = 0
  let buyValue = 0
  let sellValue = 0
  let logArray = []
  let transactionCount = 0
  let gain = 0
  for (let i = startIndex; i < quotes.length; i++) {
    let currDate = quotes[i].TIMESTAMP
    let ma7Value = ma7[currDate]
    let ma14Value = ma14[currDate]

    if ((ma7Value < ma14Value) && !bought) {
      bought = true

      let currentValue = Number(quotes[i].CLOSE)
      buyValue += currentValue
      logArray.push({ buy: currentValue })
      transactionCount++
      console.log(`bought @ ${currentValue} on ${quotes[i].TIMESTAMP}`)

    } else if ((ma7Value > ma14Value) && bought) {
      bought = false

      let currentValue = Number(quotes[i].CLOSE)
      sellValue += Number(currentValue)
      console.log(`sold @ ${currentValue} on ${quotes[i].TIMESTAMP}`)
      let currTransaction = logArray[logArray.length - 1]
      currTransaction.sell = currentValue
      currTransaction.gain = currTransaction.sell - currTransaction.buy
      gain += currTransaction.gain
    }
  }

  console.table(logArray)

  // let gain = sellValue - buyValue
  console.log(`total gain from this strategy = ${gain}`)
}