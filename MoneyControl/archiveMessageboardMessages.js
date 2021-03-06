// This script is used to fetch money control messages and save to mongodb
// note: only last 3 months of date is available
const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
const { URL, URLSearchParams } = require('url');


const dbConstants = require('../helpers/dbConstants')
const moneyControlManager = require('../MCMessageBoard')

var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  // dbConnection = db.db("MoneyControl");
  // dbConnection = dbo
  console.log("Database created!");
  // db.close();

  run(db)
  // db.close()
});


function run(db) {
  const JOB_NAME = 'archive_money_control_messages'
  const mydb = db.db('mydb')
  const messagesCollection = mydb.collection(dbConstants.collections.moneyControlMessages)
  const transactionsCollection = mydb.collection(dbConstants.collections.transactions)
  const logsCollection = mydb.collection(dbConstants.collections.logs)

  logsCollection.insertOne(new logObject(logType.info, 'started archiving!', null))

  transactionsCollection.distinct('symbol').then(docsArray => {
    // console.log(docsArray)
    if (docsArray && docsArray.length > 0) {
      docsArray.forEach(symbol => {
        let topicIdPromise = getTopicIdForSymbol(symbol, mydb)

        topicIdPromise.then(topicDoc => {
          if (topicDoc) {
            let topicId = topicDoc.moneycontrol_messageboard_topicid
            archiveMessages(topicId, db)
          }
        })
      });
    }
  })
}

function getTopicIdForSymbol(symbol, mydb) {
  const topicIdCollection = mydb.collection(dbConstants.collections.messageBoardTopicids)
  return promise = topicIdCollection.findOne({ symbol: symbol })
}


function logObject(type, message, moreInfo) {
  this.type = type
  this.message = message
  this.moreInfo = moreInfo
}

logType = {
  info: 'info',
  success: 'success',
  failure: 'failure'
}


function archiveMessages(topicId, db) {
  const mydb = db.db('mydb')
  const msgsCollecion = mydb.collection(dbConstants.collections.moneyControlMessages)
  const logsCollection = mydb.collection(dbConstants.collections.logs)
  const archiveStatusCollection = mydb.collection(dbConstants.collections.messagesArchiveStatus)
  let first_msg_id_in_db = 0

  function getMessages(pageNo, lmid) {
    logsCollection.insertOne(new logObject(logType.info, `fetching msgs for topic ${topicId}, page ${pageNo}`, { topicId, pageNo }))
    let msgsPromise = moneyControlManager.getMessagesFromMC(topicId, pageNo, lmid)
    msgsPromise.then(response => {
      logsCollection.insertOne(new logObject(logType.success, `fetched msgs for topic ${topicId}, page ${pageNo}`, { topicId, pageNo }))

      let msgs = response.data

      if (msgs && msgs.length > 0) {
        if (!first_msg_id_in_db) {
          archiveStatusCollection.updateOne({ topicid: topicId }, { $set: { fst_lmid: Number(msgs[0].msg_id), updatedDate: new Date() } })
        }
        let msgsCount = msgs.length
        let insertCount = 0
        msgs.forEach(msgObj => {
          let insertPromise = msgsCollecion.updateOne({ _id: Number(msgObj.msg_id) }, { $set: msgObj }, { upsert: true })

          // insert each message into 'money_control_messages' collection
          insertPromise
            .then(r => {
              insertCount++
              if (insertCount == msgsCount) {
                let currDate = new Date()
                archiveStatusCollection.updateOne({ topicid: topicId }, { $set: { page: pageNo + 1, lst_lmid: Number(msgObj.msg_id), updatedDate: currDate } })
              }
              console.log(`inserted topic: ${topicId} msgId: ${msgObj.msg_id}`)
              logsCollection.insertOne(new logObject(logType.success, `inserted message ${msgObj.msg_id}`, { topicId, msg_id: msgObj.msg_id }))
            })
            .catch(e => {
              logsCollection.insertOne(new logObject(logType.failure, `failed to insert message ${msgObj.msg_id}`, { topicId, msg_id: msgObj.msg_id }))
            })
        })

        let new_lmid = msgs[msgs.length - 1].msg_id

        getMessages(pageNo + 1, new_lmid)
      } else {
        console.log(`no msgs for topic: ${topicId}, page: ${pageNo}`)
      }

    }).catch(err => {
      logsCollection.insertOne(new logObject(logType.failure, `failed to fetch msgs for topic ${topicId}, page ${pageNo}`, { topicId, pageNo }))
    })
  }

  let pageNo = 1
  let lmid = null

  archiveStatusCollection.findOne({ topicid: topicId }).then(doc => {
    if (doc) {
      first_msg_id_in_db = doc.fst_lmid
      // archiving has started.
      getMessages(doc.page, doc.lst_lmid)
    } else {
      archiveStatusCollection.insertOne(new archiveStatus(topicId, 1, null, null))
      getMessages(pageNo, lmid)
    }
  })
}

function archiveStatus(topicId, page, fst_lmid, lst_lmid) {
  this.topicid = topicId
  this.page = page
  this.fst_lmid = fst_lmid
  this.lst_lmid = lst_lmid
}