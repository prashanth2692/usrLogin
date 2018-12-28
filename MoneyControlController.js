var express = require('express')
var router = express.Router()
var dbConnection = require('./dbConnection').dbConnection
const circularJSON = require('circular-json');
const inspect = require('util').inspect


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
  // .then((result) => {
  //   res.status(200).json(result)
  // }).catch((err) => {
  //   const errorMsg = 'failed to fetch messages!'
  //   console.error(errorMsg)
  //   res.status(500).json({ error: 500, message: errorMsg })
  // });
  // res.send('money control controller')
})


module.exports = router