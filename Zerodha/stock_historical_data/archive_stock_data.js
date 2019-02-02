// This script is archive historical stock data per day
const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
const { URL, URLSearchParams } = require('url');
const _ = require('underscore')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v1')


const dbConstants = require('../../helpers/dbConstants')
// const moneyControlManager = require('../MCMessageBoard')

// var url = "mongodb://localhost:27017/"

// MongoClient.connect(url, function (err, db) {
//   if (err) throw err;

//   // dbConnection = db.db("MoneyControl");
//   // dbConnection = dbo
//   console.log("Database created!");
//   // db.close();

//   run(db)
//   // db.close()
// });


const JOB_NAME = 'archive_historical_data_zerodha_day'
const JOB_UUID = uuid()

function log(status, message, url, params) {
  this.jobName = JOB_NAME
  this.jobId = JOB_UUID
  this.status = status
  this.message = message
  this.url = url
  this.params = params
}

let collectionName = ''
function run(instrumentToken, db, clxName) {
  collectionName = clxName
  const mydb = db.db('mydb')
  // const messagesCollection = mydb.collection(dbConstants.collections.moneyControlMessages)
  // const transactionsCollection = mydb.collection(dbConstants.collections.transactions)
  const logsCollection = mydb.collection(dbConstants.collections.logs)

  const historicalCollection = mydb.collection(collectionName)

  logsCollection.insertOne(new log('info', 'starting job'))
  let stockName = 'BEPL'
  let currDate = new Date()
  let month = currDate.getMonth() < 9 ? '0' + (currDate.getMonth() + 1) : currDate.getMonth() + 1
  let to = currDate.getFullYear() + '-' + month + '-' + currDate.getDate()
  let from = currDate.getFullYear() - 4 + '-' + month + '-' + currDate.getDate()
  let promise = getHistorical(instrumentToken, from, to, mydb)

  promise.then(result => {
    // let flattenedData = _.flatten(historicalDate)

    result.historicalData.forEach(d => {
      let temp = {
        date: d[0],
        open: d[1],
        high: d[2],
        low: d[3],
        close: d[4],
        volume: d[5]
      }
      historicalCollection.updateOne({ _id: temp.date }, { $set: temp }, { upsert: 1 }).then(doc => {
        //
      }).catch(err => {
        console.log(err.msg)
      })
    })

    fs.writeFile("output/bepl_day_" + result.from + '-' + to + ".json", JSON.stringify(result.historicalDate), function (err) {
      if (err) throw err;
      console.log('complete');
      logsCollection.insertOne(new log('info', 'wrote data to file'))
      // db.close()
    }
    )

  }).catch(err => {
    console.log(err.message)
    // db.close()
  })
}


function getHistorical(instrumentToken, from, to, mydb) {
  // const archiveStatusCollection = mydb.collection('zerosha_archive_status')
  const historicalCollection = mydb.collection(collectionName)
    const logsCollection = mydb.collection(dbConstants.collections.logs)
    
    let fetchedFrom = null
    let fetchedTo = null

    let historicalData = []
    
  function getData(from, to, resolve, reject) {
      function getHistoricalData() {
      let url = `https://kitecharts-aws.zerodha.com/api/chart/${instrumentToken}/day`
    console.log(instrumentToken, `fetching from ${from} to ${to}`)
      logsCollection.insertOne(new log('info', `fetching from ${from} to ${to}`, url, { from, to, instrumentToken }))

      // getData(from, to, resolve, reject)
      // console.log(`getting data from ${from} to ${to}`)
      const messageBoardURL = new URL(url)
      const messageBoardQueryParams = new URLSearchParams({
        public_token: 'YQOnLd4GqdUT548pBaHp9raifn0WGGFv',
        user_id: 'YE1705',
        api_key: 'kitefront',
        access_token: 'd6vogWx6c9LR1Fh6Y9sowGBbska7zta1',
        from: from,
        to: to,
        ciqrandom: (new Date()).getTime()
      })

      messageBoardURL.search = messageBoardQueryParams

      let promise = axios.get(messageBoardURL.href)

      promise.then(resp => {
        logsCollection.insertOne(new log('success', `fetched from ${from} to ${to}`, url, { from, to, instrumentToken }))

        if (resp && resp.data && resp.data.data) {
          let data = resp.data.data
          let candles = data.candles

          if (candles && candles.length > 0) {
            historicalData = historicalData.concat(candles)
            let temp_from = new Date(from)
            // let temp_to = new Date(to)
            let month = temp_from.getMonth() < 9 ? '0' + (temp_from.getMonth() + 1) : temp_from.getMonth() + 1
            let newFrom = temp_from.getFullYear() - 4 + '-' + month + '-' + temp_from.getDate()
            let newTo = from //temp_from.getFullYear() - 4 + '-' + month + '-' + temp_from.getDate()
            getData(newFrom, newTo, resolve, reject)
          } else {
            resolve({ historicalData, from: to })
          }
        }

      }).catch(err => {
        console.log(err.data)
        logsCollection.insertOne(new log('failed', `failed to fetch from ${from} to ${to}`, url, { from, to, instrumentToken }))
        reject({ msg: 'failed to retrieve historical reccords' })
      })
    }


    historicalCollection.find({}).sort({ date: -1 }).limit(1).toArray((err, doc) => {
      if (doc && doc.length > 0) {
        fetchedTo = doc[0].date

        historicalCollection.find().sort({ date: 1 }).limit(1).toArray((err, doc) => {
          if (doc && doc.length > 0) {
            fetchedFrom = doc[0].date
            console.log(`fetched from ${fetchedFrom} to ${fetchedTo}`)

            // if (to <= fetchedTo) {
            //   if (from >= fetchedFrom) {
            //     //do nothing, already fetched records between from and to
            //   } else {
            //     to = fetchedFrom.slice(0, 10)
            //   }
            // }
            // else {
            //   if (from < fetchedTo) {
            //     from = fetchedTo.slice(0, 10)
            //   }
            // }

            if (from < to && !(from >= fetchedFrom && to <= fetchedTo)) {
              getHistoricalData()
            } else {
              reject({ msg: 'records already fetched for the given date range' })
            }
          }
        })
      } else {
        // not processed, continue
        getHistoricalData()
      }
    })
  }
  let retPromise = new Promise((resolve, reject) => {
    if (from > to) {
      reject({ msg: 'invalid date range' })
    }

    getData(from, to, resolve, reject)
  })


  return retPromise

}

module.exports = run




// https://kitecharts-aws.zerodha.com/api/chart/107265/day?public_token=YQOnLd4GqdUT548pBaHp9raifn0WGGFv&user_id=YE1705&api_key=kitefront&access_token=d6vogWx6c9LR1Fh6Y9sowGBbska7zta1&from=2004-04-21&to=2019-01-30