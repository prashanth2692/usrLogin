var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient;

const getDynamicHoldings = require('../portfolio/holdingsCalulation.js')
const getDynamicHoldings_v2 = require('../portfolio/holdingsCalulation_v2.js')
// var mydb = require('./dbConnection').dbConnection
// const URL = require('url')

const consolidatedJson = require('../ICICIDirect/output/consolidatedHoldings_obj.json')


router.use((req, res, next) => {
  console.log('holdingsController')
  next()
})

router.get('/holdings', (req, res) => {
  res.status(200).send(consolidatedJson)
})

router.get('/dynamic-holdings', (req, res) => {
  var url = "mongodb://localhost:27017/"

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    console.log("Database connection created!");
    let promise = getDynamicHoldings(db, true)
    promise.then((holdings) => {
      res.status(200).send(holdings)
    }).catch(err => {
      res.status(500).send(err)
    })
  });
})

router.get('/dynamic-holdings_v2', (req, res) => {
  const userUID = req.context ? req.context.uid : null
  var url = "mongodb://localhost:27017/"

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    console.log("Database connection created!");
    let promise = getDynamicHoldings_v2(db, userUID)
    promise.then((holdings) => {
      res.status(200).send(holdings)
    }).catch(err => {
      res.status(500).send(err)
    })
  });
})

router.get('/pastHoldings', (req, res) => {
  const userUID = req.context ? req.context.uid : null
  var url = "mongodb://localhost:27017/"

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    console.log("Database connection created!");
    let promise = getDynamicHoldings_v2(db, userUID, true)
    promise.then((holdings) => {
      res.status(200).send(holdings)
    }).catch(err => {
      res.status(500).send(err)
    })
  });
})


module.exports = router