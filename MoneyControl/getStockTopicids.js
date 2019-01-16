const axios = require('axios')
const HTMLParser = require('node-html-parser');
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient

const nseJsonArray = require('../ICICIDirect/output/NSE_EQUITY_L_ARRAY.json')

// Initialize the connection as a promise:
const uri = 'mongodb://localhost:27017/'
MongoClient.connect(uri, function (err, db) {
  if (err) throw err;

  // name of the DB to use is: "mydb"
  // dbConnection = dbo
  console.log("Database created!");
  // db.close();
  // doSomeWork(mydb, db)

  getTopicIds(db)
});


// sample code
// function doSomeWork(db) {
//   let mydb = db.db("mydb");

//   // connection.then((err, db) => {
//   const doc = { id: 3 }
//   // const mydb = db.db('mydb')
//   const coll = mydb.collection('mc_test')
//   coll.insertOne(doc, (err, result) => {
//     if (err) throw err
//   })

//   // coll.find({ id: 3 }, (err, result) => {
//   //   console.log(result)
//   // })
//   // })

//   // connection.then((err, db) => {
//   //   const mydb = db.db('mydb')
//   // const coll = mydb.collection('mc_test')

//   coll.find({ id: 3 }).toArray((err, result) => {
//     console.log(result)
//   })
//   // })

//   db.close()

// }
// smaple code -end



// testing
// console.log(nseJsonArray[0])



function getTopicIds(db) {
  const mydb = db.db("mydb");

  // the money control autosuggest reponse returns "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" type and not object
  // so need to mock suggest1 function, inside which the required response is passed as argument

  let topicIdCollection = mydb.collection('message_board_topicids')
  let logCollection = mydb.collection('logs')

  // drop if sraping for all scrips
  // topicIdCollection.drop()

  const statusCodes = {
    success: 'SUCCESS',
    failure: 'FAILURE',
  }

  const logType = {
    info: "info",
    success: 'success',
    error: 'error'
  }

  logCollection.insertOne({ type: logType.info, msg: "started scraping" }, (err, result) => {
    if (err) console.log(err)
  })

  function suggest1(arr) {
    return arr
  }

  const promises1 = []
  const promises2 = []
  // const promises3 = []
  const messageBoardLinks = {}

  var timeoutTime = 0
  var incrementValue = 1000

  nseJsonArray.forEach((nj, index) => {

    // testing with one record
    // let nj = { symbol: "BPL", isin_number: "INE110A01019" }
    // let index = 1
    // testing with one record - end
    setTimeout(() => {
      let promise = axios.get('https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?classic=true&query=' + nj.isin_number + '&type=1&format=json&callback=suggest1').then(resp => {
        // console.log(resp.data)
        // let obj = JSON.parse(resp.data)
        let obj = eval(resp.data)
        // console.log(obj.length)
        if (obj && obj.length > 0 && obj[0].link_src) {
          let reqLink = obj[0].link_src
          let promise2 = axios.get(reqLink).then(resp => {
            const parsed = HTMLParser.parse(resp.data)

            let topicIdQuery = parsed.querySelector('#f_topicid')
            let topicId = ""
            let _topicId = null
            if (topicIdQuery && topicIdQuery.attributes.value > 0) {
              // this is sufficient for fetching messagesboard messages through API 
              topicId = topicIdQuery.attributes.value
              let tempObj = { symbol: nj.symbol, isin: nj.isin_number, moneycontrol_messageboard_topicid: topicId, with_link: false }
              topicIdCollection.insertOne(tempObj, (err, record) => {
                _topicId = tempObj._id
                if (err) {
                  logCollection.insertOne({ type: logType.error, msg: "topicId could not be inserted for: " + nj.symbol, referenceId: _topicId })
                } else {
                  console.log(index, nj.symbol, 'inserted record')
                  logCollection.insertOne({ type: logType.success, msg: "topicId inserted for: " + nj.symbol, referenceId: _topicId })
                }
              })
            }


            // let result = parsed.querySelector("#compid_imp")
            // if (result && result.attributes.value) {
            //   // console.log(result)
            //   // console.log(result.attributes.value) // this will get the html which has the actuial message board link
            //   let companyId = result.attributes.value

            //   console.info(index, "compnayid: ", companyId)
            //   let promise3 = axios.post("https://www.moneycontrol.com/stocks/company_info/stock-messages.php", "sc_id=" + companyId).then(resp => {
            //     const parsed = HTMLParser.parse(resp.data)
            //     let result = parsed.querySelectorAll("a.bl_11")
            //     // console.log(result)
            //     if (result && result.length > 0) {

            //       // href example: https://mmb.moneycontrol.com/forum-topics/stocks/tata-motors-1605.html // 1605 is the topicId
            //       let msgBoardLink = result[0].attributes.href
            //       messageBoardLinks[nj.symbol] = msgBoardLink

            //       topicIdCollection.insertOne({ with_link: true, symbol: nj.symbol, isin: nj.isin_number, moneycontrol_messageboard_topicid: topicId, moneycontrol_messageboard_link: msgBoardLink }, (err, record) => {
            //         console.info(index, "updated with href for: ", nj.symbol)
            //       })
            //     }

            //     // verification
            //     // result.forEach(r => {
            //     //   if (r.innerHTML == 'More Messages »') {
            //     //     console.log(r.innerHTML, r.attributes.href)
            //     //     // sample output below. Required first link
            //     //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=latest
            //     //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&pgno=1&que=queries
            //     //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=active
            //     //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=activeborder
            //     //   }
            //     // })
            //     // verification - end

            //   }).catch(err => {
            //     console.error(index, "failed to fetch partical message board html for messageboard link for: ", nj.symbol)
            //     logCollection.insertOne({ type: logType.error, msg: "failed to fetch partical message board html for messageboard link for: " + nj.symbol, symbol: nj.symbol })
            //   });

            //   promises3.push(promise3)
            // } else {
            //   console.error(index, "failed to fetch partical message board html for messageboard link for: ", nj.symbol)
            //   logCollection.insertOne({ type: logType.error, msg: "failed to fetch partical message board html for messageboard link for: " + nj.symbol, symbol: nj.symbol })

            // }
          }).catch(err => {
            console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
            logCollection.insertOne({ type: logType.error, msg: "no autosuggest results found for symbol: " + nj.symbol, symbol: nj.symbol })
          })
          promises2.push(promise2)
        } else {
          console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
          logCollection.insertOne({ type: logType.error, msg: "no autosuggest results found for symbol: " + nj.symbol, symbol: nj.symbol })
        }
      }).catch(err => {
        console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
        logCollection.insertOne({ type: logType.error, msg: "no autosuggest results found for symbol: " + nj.symbol, symbol: nj.symbol })
      })

      promises1.push(promise)
    }, timeoutTime)

    timeoutTime += incrementValue

  })


  setTimeout(() => {
    axios.all(promises1).then(responses1 => {
      axios.all(promises2).then(responses2 => {
        // axios.all(promises3).then(responses3 => {
        fs.writeFile('messageBoardLinks.json', JSON.stringify(messageBoardLinks), (err) => {
          if (err) {
            console.log(err)
          } else {
            console.log('written file!')
            logCollection.insertOne({ type: logType.info, msg: "finished scraping!" })

          }

          db.close()
        })
        // }).catch(err3 => {
        //   console.log("err3")
        //   logCollection.insertOne({ type: logType.error, msg: "err3" })
        //   db.close()
        // })
      }).catch(err2 => {
        logCollection.insertOne({ type: logType.error, msg: "err2" })
        console.log("err2")
      })
    }).catch(err1 => {
      logCollection.insertOne({ type: logType.error, msg: "err1" })
      console.log("err1")
    })
  }, timeoutTime)




  // autosuggest:
  // no match response

  // [
  //   {
  //       "link_src": "",
  //       "link_track": "",
  //       "pdt_dis_nm": "No Result Available",
  //       "sc_id": "",
  //       "stock_name": ""
  //   }
  // ]
}