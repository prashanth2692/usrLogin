var express = require('express')
var router = express.Router()
var dbConnection = require('./dbConnection').dbConnection
const URL = require('url')

const MCManager = require('./MCMessageBoard.js')


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
    res.status(500).json({msg: 'error'})
  });
})


module.exports = router