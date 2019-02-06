// This script is archive historical stock data per day
const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
const { URL, URLSearchParams } = require('url');
const _ = require('underscore')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v1')
const moment = require('moment')


const dbConstants = require('../../helpers/dbConstants')
const JOB_NAME = 'archive_historical_data_zerodha_day'
const JOB_UUID = uuid()
const DATE_FORMAT = 'YYYY-MM-DD'

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
  const logsCollection = mydb.collection(dbConstants.collections.logs)

  const historicalCollection = mydb.collection(collectionName)

  logsCollection.insertOne(new log('info', 'starting job'))
  let to = moment().format(DATE_FORMAT) //currDate.getFullYear() + '-' + month + '-' + day
  let from = moment().subtract(4, 'y').format(DATE_FORMAT) //currDate.getFullYear() - 4 + '-' + month + '-' + day
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

    fs.writeFile(`output/${collectionName}_` + result.from + '-' + to + ".json", JSON.stringify(result.historicalDate), function (err) {
      if (err) throw err;
      console.log('complete');
      logsCollection.insertOne(new log('info', 'wrote data to file'))
      // db.close()
    }
    )

  }).catch(err => {
    console.log(err.msg)
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
    function getHistoricalData(from, to) {
      let url = `https://kitecharts-aws.zerodha.com/api/chart/${instrumentToken}/day`
      console.log(collectionName, `fetching from ${from} to ${to}`)
      logsCollection.insertOne(new log('info', `fetching from ${from} to ${to}`, url, { from, to, instrumentToken }))

      // getData(from, to, resolve, reject)
      // console.log(`getting data from ${from} to ${to}`)
      const messageBoardURL = new URL(url)
      const messageBoardQueryParams = new URLSearchParams({
        public_token: 'CB2GHAaesV82yrb4oMmZjZ2RsfT4puCl',
        user_id: 'YE1705',
        api_key: 'kitefront',
        access_token: 'LXAkCrPfmemvbNkbTOxQeW9v7pNSwZIX',
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
            let newFrom = moment(from).subtract(4, 'y').format(DATE_FORMAT)
            let newTo = from
            getData(newFrom, newTo, resolve, reject)
          } else {
            resolve({ historicalData, from })
          }
        }

      }).catch(err => {
        console.log(err.response.data)
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
            console.log(collectionName, `fetched from ${fetchedFrom} to ${fetchedTo}`)

            if (from < to && !(from >= fetchedFrom && to <= fetchedTo)) {
              if (from < fetchedTo) {
                // fetch records only from last fetched date
                from = fetchedTo.slice(0, 10)
              }
              getHistoricalData(from, to)
            } else {
              if (historicalData && historicalData.length > 0) {
                resolve({ historicalData, from })
              } else {
                reject({ msg: 'records already fetched for the given date range' })
              }
            }
          }
        })
      } else {
        // not processed, continue
        getHistoricalData(from, to)
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