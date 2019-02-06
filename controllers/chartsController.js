var express = require('express')
var router = express.Router()
const bplData = require('../../../Stocks/BPL/BPL_2013-02-09_2018-02-09.json')
var MongoClient = require('mongodb').MongoClient;
// var mydb = require('./dbConnection').dbConnection
// const URL = require('url')
const mTz = require('moment-timezone')

router.use((req, res, next) => {
  console.log('chartsController')
  next()
})

router.get('/:symbol', (req, res) => {
  var url = "mongodb://localhost:27017/"

  MongoClient.connect(url, function (err, db) {
    if (err) {
      res.status(500).json({ msg: err.message })
      return
    };

    let routeParams = req.params

    if (routeParams && routeParams.symbol) {
      let symbol = routeParams.symbol
      let mydb = db.db('mydb')
      let bplHistorical = mydb.collection(`zerodha_${symbol}_day`)

      bplHistorical.find({}).toArray((err, data) => {
        db.close()
        if (data) {
          data = data.map(d => {
            return [d.date.slice(0, 10), d.open, d.high, d.low, d.close, d.volume]
          })
          res.status(200).json(data)
        }
        else
          res.status(500).json({ msg: 'error' })
      })
    } else {
      res.status(400).json({ msg: 'bad request, not valid symbol' })
    }
  })
})

router.get('/day/:symbol', (req, res) => {
  var url = "mongodb://localhost:27017/"

  MongoClient.connect(url, function (err, db) {
    if (err) {
      res.status(500).json({ msg: err.message })
      return
    };

    let routeParams = req.params

    if (routeParams && routeParams.symbol) {
      let symbol = routeParams.symbol
      let mydb = db.db('mydb')
      let dayLogClx = mydb.collection(`${symbol}_seconds_log`)

      let today = mTz().tz('asia/calcutta').format('YYYY-MM-DD')
      let todayEnd = today + " 15:45:00"
      // let tomorrow = mTz().tz('asia/calcutta').add(1, 'd').format('YYYY-MM-DD ')

      dayLogClx.find({ _id: { $gt: today, $lt: todayEnd } }).sort({ _id: 1 }).toArray((err, data) => {
        db.close()
        if (data) {
          data = data.map(d => {
            return [d[0], Number(d.pricecurrent), Number(d.VOL)]
          })
          res.status(200).json(data)
        }
        else
          res.status(500).json({ msg: 'error' })
      })
    } else {
      res.status(400).json({ msg: 'bad request, not valid symbol' })
    }
  })
})


module.exports = router