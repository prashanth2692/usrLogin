//@ts-check
var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient;
const URL = require('url')
const url = "mongodb://localhost:27017/"

const dbConstants = require('../helpers/dbConstants')


router.use((req, res, next) => {
  console.log('SymbolSearchController')
  next()
})

router.get('/search', (req, res) => {
  const url_parts = URL.parse(req.url, true)
  const query = url_parts.query
  const partialName = query.partialName
  const top = Number(query.top) || 0 // 0 -> no limit
  console.log(`symbol search partial name: ${partialName}`)

  if (partialName) {

    MongoClient.connect(url, function (err, db) {
      if (err) {
        res.status(500).send(err.message)
        return
      };
      const mydb = db.db('mydb')
      const msgBoardClx = mydb.collection(dbConstants.collections.messageBoardTopicids)

      msgBoardClx.find({ symbol: { $regex: partialName, $options: 'i' } }).toArray((err, docs) => {
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
    res.status(400).json({ msg: 'no symbols provided' })
  }
})


module.exports = router