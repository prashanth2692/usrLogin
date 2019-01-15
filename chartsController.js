var express = require('express')
var router = express.Router()
const bplData = require('../../Stocks/BPL/BPL_2013-02-09_2018-02-09.json')
// var mydb = require('./dbConnection').dbConnection
// const URL = require('url')


router.use((req, res, next) => {
  console.log('chartsController')
  next()
})

router.get('/bpl', (req, res) => {
  let x = 0
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
  bplData.data.candles.forEach(candle => {
    candle[0] = candle[0].slice(0, 10)
  })
  res.status(200).json(bplData.data.candles)
})


module.exports = router