var express = require('express')
var router = express.Router()
// var mydb = require('./dbConnection').dbConnection
// const URL = require('url')

const consolidatedJson = require('./ICICIDirect/output/consolidatedHoldings_obj.json')


router.use((req, res, next) => {
  console.log('holdingsController')
  next()
})

router.get('/holdings', (req, res) => {
  res.status(200).send(consolidatedJson)
})


module.exports = router