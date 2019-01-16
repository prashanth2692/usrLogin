var express = require('express')
var router = express.Router()
var dbConnection = require('../dbConnection').dbConnection
const URL = require('url')
const nseList = require('../helpers/nseStockList')

const MCManager = require('../MCMessageBoard.js')


//constants
const collectionName = 'MoneyControlMessages'
router.use((req, res, next) => {
  console.log('MoneyControlController')
  next()
})

router.get('/messages', (req, res) => {
  dbConnection().collection(collectionName).find().toArray((err, result) => {
    if (err) {
      const errorMsg = 'failed to fetch messages!'
      console.error(errorMsg)
      res.status(500).json({ error: 500, message: errorMsg })
    }
    else {
      //In Node.js, you can use util.inspect(object). It automatically replaces circular links with "[Circular]".
      res.status(200).json(result)
    }
  })
})


router.get('/messages_alt', (req, res) => {
  // dbConnection().collection(collectionName).find().toArray((err, result) => {
  //   if (err) {
  //     const errorMsg = 'failed to fetch messages!'
  //     console.error(errorMsg)
  //     res.status(500).json({ error: 500, message: errorMsg })
  //   }
  //   else {
  //     //In Node.js, you can use util.inspect(object). It automatically replaces circular links with "[Circular]".
  //     res.status(200).json(result)
  //   }
  // })
  const url_parts = URL.parse(req.url, true)
  const query = url_parts.query
  const pgno = query.pgno
  const lmid = query.lmid
  const topicid = query.topicid
  MCManager.getMessagesFromMC(topicid, pgno, lmid).then((result) => {
    // console.log(result)
    res.json(result.data)
  }).catch((err) => {
    console.error(err)
    res.status(500).json({ msg: 'error' })
  });
})

router.get('/getTopicIDForSymbol', (request, res) => {
  var url_parts = URL.parse(request.url, true);
  var query = url_parts.query;
  var symbol = query.symbol;

  let topicIdCollection = dbConnection().collection('message_board_topicids')

  topicIdCollection.findOne({ "symbol": symbol }, (err, data) => {
    if (err) {
      res.status(500).json({ message: "failed to connect to db" })
    }
    if (data) {
      res.status(200).json({ symbol: symbol, topicid: data.moneycontrol_messageboard_topicid })
    } else {
      res.status(500).json({ message: "failed to fetch money control topicId" })
    }
  })
})


module.exports = router