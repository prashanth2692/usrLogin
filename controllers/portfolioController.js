var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient;
const URL = require('url')

const dbConstants = require('../helpers/dbConstants')


router.use((req, res, next) => {
  console.log('portfolioController')
  next()
})

router.get('/transactionsBySymbol', (req, res) => {
  const url_parts = URL.parse(req.url, true)
  const query = url_parts.query
  const symbol = query.symbol

  if (symbol) {
    var url = "mongodb://localhost:27017/"

    MongoClient.connect(url, function (err, db) {
      if (err) {
        res.status(500).send(err.message)
        return
      };
      const mydb = db.db('mydb')
      const txColx = mydb.collection(dbConstants.collections.transactions)

      txColx.find({ symbol: symbol }).sort({ date: -1 }).toArray((err, docs) => {
        if (err) {
          db.close()
          res.status(500).send(err.message)
          return
        }
        db.close()
        res.status(200).json(docs)
      })
    });
  } else {
    res.status(400).json({ msg: 'no symbol provided' })
  }
})


module.exports = router