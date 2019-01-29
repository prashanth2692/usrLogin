const { URL, URLSearchParams } = require('url');
const https = require('https');
const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
// const connection = require('./dbConnection.js');

// const dbConnection = connection.dbConnection()

// var url = "mongodb://localhost:27017/userLogin"; -> this will create userLogin DB if it doesn't exist
var url = "mongodb://localhost:27017/"

// MongoClient.connect(url, function (err, db) {
//   if (err) throw err;

//   // dbConnection = db.db("MoneyControl");
//   // dbConnection = dbo
//   console.log("Database created!");
//   // db.close();

//   // run(db.db('mydb'))
//   db.close()
// });

function run(db) {
  const dbConnection = db

  const messageBoardURL = new URL('https://mmb.moneycontrol.com/index.php')
  const MCMBCollection = 'MoneyControlMessages'

  const messageBoardQueryParams = new URLSearchParams({
    q: 'topic/ajax_call',
    section: 'get_messages',
    is_topic_page: 1,
    offset: 0, // (pgno - 1) * 10
    lmid: null,
    isp: 0, // 1 for pgno > 1
    gmt: 'tp_lm',
    tid: 1642,
    pgno: 1
  })

  messageBoardURL.search = messageBoardQueryParams

  console.log('request URL: ' + messageBoardURL.href + '\n')
  https.get(messageBoardURL.href, (resp) => {
    response = ''
    resp.on('data', (chunk) => {
      response += chunk
    })

    resp.on('end', () => {
      console.log('response: \n')
      let parsedResp = JSON.parse(response)
      // add documents to collection MCMB

      // if(!dbConnection.getCollection(MCMBCollection).exists()){
      //   dbConnection.createCollection(MCMBCollection)
      // }
      var mcmb = dbConnection.collection(MCMBCollection)
      mcmb.remove()
      mcmb.insert(parsedResp).then(resp => {
        console.log('inserted\n')
        mcmb.find().toArray((err, result) => {
          if (err) {
            console.log(err)
          }
          console.log('reading after inserting: \n' + result)
        })


      })
      // db.close()
      // parsedResp.map((msg, index) => console.log('\n\n\n\n------------' + index + ' : ' + msg.full_message))
    })
  }).on('error', err => {
    console.log('error ' + err.message)
  })
}


function getMessagesFromMC(topicId, pageNo, lmid) {
  const messageBoardURL = new URL('https://mmb.moneycontrol.com/index.php')
  const messageBoardQueryParams = new URLSearchParams({
    q: 'topic/ajax_call',
    section: 'get_messages',
    is_topic_page: 1,
    offset: (pageNo - 1) * 10, // (pgno - 1) * 10
    lmid: lmid,
    isp: pageNo > 1 ? 1 : 0, // 1 for pgno > 1
    gmt: 'tp_lm',
    tid: topicId,
    pgno: pageNo
  })

  messageBoardURL.search = messageBoardQueryParams

  return axios.get(messageBoardURL.href)
}

exports.getMessagesFromMC = getMessagesFromMC