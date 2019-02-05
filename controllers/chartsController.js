var express = require('express')
var router = express.Router()
const bplData = require('../../../Stocks/BPL/BPL_2013-02-09_2018-02-09.json')
var MongoClient = require('mongodb').MongoClient;
// var mydb = require('./dbConnection').dbConnection
// const URL = require('url')


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
  // let processedData = bplData.data.candles.map(c => {
  //   return {
  //     date: c[0],
  //     open: c[1],
  //     high: c[2],
  //     low: c[3],
  //     volume: c[4],
  //     x: x++
  //   }
  // })
  // bplData.data.candles.forEach(candle => {
  //   candle[0] = candle[0].slice(0, 10)
  // })
  // res.status(200).json(bplData.data.candles)
})


module.exports = router