//@ts-check

var express = require('express')
var router = express.Router()
var dbConnection = require('../dbConnection').dbConnection
const URL = require('url')
const nseList = require('../helpers/nseStockList')
const _ = require('underscore')
const MCManager = require('../MCMessageBoard.js')
const dbConstants = require('../helpers/dbConstants')
const uuid = require('uuid/v1')
const moment = require('moment')

//constants
const JOB_UUID = uuid()
const JOB_NAME = 'moneycontrol_messages_controller'
const collectionName = 'MoneyControlMessages'
let spamUserIds = null
let msgsClx = dbConnection().collection(dbConstants.collections.moneyControlMessages)
let logsClx = dbConnection().collection(dbConstants.collections.logs)

function log(status, message, params) {
  this.jobName = JOB_NAME
  this.jobId = JOB_UUID
  this.status = status
  this.message = message
  this.params = params
  this.createDateTime = moment().format('YYYY-MM-DD:HH:mm:ss')
}

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

  // if (!spamUserIds) {
  //   dbConnection().collection('moneycontrol_spam_users').find().toArray().then(docs => {
  //     spamUserIds = docs.map(d => d._id)
  //     getMessages()
  //   })
  // } else {
  //   getMessages()
  // }
  // function getMessages() {
  let spamUserIds = []
  dbConnection().collection(dbConstants.collections.moneycontrolSpamUsers).find().toArray().then(docs => {
    MCManager.getMessagesFromMC(topicid, pgno, lmid).then((result) => {
      // console.log(result)
      if (docs) {
        spamUserIds = docs.map(d => d._id)
      }

      if (result && result.data.length) {
        let dataWith_id = result.data.map(doc => {
          doc._id = doc.msg_id
          return doc
        })

        // below logic needs to be implemented
        dataWith_id.forEach(msg => {
          msgsClx.updateOne({ _id: msg._id }, { $set: msg }, { upsert: true })
            .then((res) => {
              // console.log(`upadted moneycontrol message with id ${msg._id}`)
              if (res.upsertedCount > 0) {
                logsClx.insertOne(new log('success', `Inserted msg ${msg._id}`))
              } else {
                logsClx.insertOne(new log('success', `Updated msg ${msg._id}`))
              }
            }).catch(err => {
              logsClx.insertOne(new log('error', `update failed: ${msg._id}`, { errMsg: err.message }))
              console.log(`update failed: ${msg._id}`)
            })
        });
      }

      let retData = _.filter(result.data, (msg) => {
        return spamUserIds.indexOf(msg.user_id) < 0
      })

      res.status(200).json(retData)
      // update
    }).catch((err) => {
      console.error(err)
      res.status(500).json({ msg: 'error' })
    });
  })

  // }
})

router.get('/getTopicIDForSymbol', (request, res) => {
  var url_parts = URL.parse(request.url, true);
  var query = url_parts.query;
  var symbol = query.symbol;
  var symbols = query.symbols;

  let topicIdCollection = dbConnection().collection('message_board_topicids')
  if (symbols) {
    //@ts-ignore symbols is comma separated string
    let symbolsList = symbols.split(',')
    if (symbolsList.length > 0) {
      topicIdCollection.find({ symbol: { $in: symbolsList } }).toArray((err, arr) => {
        if (err) {
          res.status(500).json({ message: "Failed to fetch topics for given symbols" })
        } else {
          res.status(200).json(arr)
        }
      })
    } else {
      res.status(400).json({ message: "no symbols mentioned" })
    }
  } else {

    topicIdCollection.findOne({ "symbol": symbol }, (err, data) => {
      if (err) {
        res.status(500).json({ message: "failed to connect to db" })
      }
      if (data) {
        res.status(200).json({ symbol: symbol, topicid: data.moneycontrol_messageboard_topicid, compid: data.compid_imp })
      } else {
        res.status(500).json({ message: "failed to fetch money control topicId" })
      }
    })
  }
})

router.post('/reportUser', (request, res) => {
  // var url_parts = URL.parse(request.url, true);
  // var query = url_parts.query;
  // var symbol = query.symbol;
  // var symbols = query.symbols;

  // let nick_name = request.body.nick_name
  console.log(request.body)

  dbConnection().collection('moneycontrol_spam_users').insertOne({ _id: request.body.user_id, nick_name: request.body.nick_name }).then(() => {
    dbConnection().collection('logs').insertOne({ jobName: 'moneycontrol_repost_spam_user', status: 'success', message: `${request.body.nick_name} has been reported for spam.` })
    res.status(200).json()
  }).catch(err => {
    dbConnection().collection('logs').insertOne({ jobName: 'moneycontrol_repost_spam_user', status: 'failure', message: `failed to mark ${request.body.nick_name} as spam user.` })
    res.status(500).json({ msg: 'failed to report user.' })
  })
})


module.exports = router