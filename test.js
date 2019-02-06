const axios = require('axios')
var MongoClient = require('mongodb').MongoClient;
// const moment = require('moment')
const momentTz = require('moment-timezone')
const dbConstants = require('./helpers/dbConstants')

// var mongoose = require('mongoose')

// mongoose.connect("mongodb://localhost:27017/mydb");

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));


// var kittySchema = mongoose.Schema({
//   name: String,
//   qwe: String
// });


// var Kitten1 = mongoose.model('Kitten', kittySchema);



// db.once('open', function () {
//   console.log('db connection established')
//   var silence = new Kitten1({ name: 'Silence', });
//   console.log(silence);
//   silence.save()

//   Kitten1.find(function (err, docs) {
//     console.log(docs)
//   })
// });


let rCom_COmpiID = 'RCV02'
var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) {
    // res.status(500).send(err.message)
    return
  };
  const mydb = db.db('mydb')
  const mcTopicIdClx = mydb.collection(dbConstants.collections.messageBoardTopicids)
  const txClx = mydb.collection(dbConstants.collections.transactions)
  const logClx = mydb.collection(dbConstants.collections.logs)
  const moment = momentTz().tz('asia/calcutta')
  const todayDate = moment.format('YYYY-MM-DD')

  txClx.distinct('symbol', (err, symbols) => {
    // console.log(symbols.length)
    mcTopicIdClx.find({ symbol: { $in: symbols } }).toArray((err, docs) => {
      // console.log(docs.length)
      if (err) throw err;
      let count = 0
      docs.forEach(doc => {
        let index = count++
        let clx = mydb.collection(doc.symbol + '_seconds_log')
        // to get quote just after 1530 for updated closing price
        let stopInterval = false
        let interval = setInterval(() => {
          let currentTime = momentTz().tz('asia/calcutta').format('HHmm')


          // if (currentTime < '1530') {
          axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${doc.compid_imp}`).then(resp => {
            let data = resp.data.data
            // console.log(data.pricecurrent, data.VOL)

            let dateTime = todayDate + ' ' + data[0] // data[0] is time of the snapshot
            data.date = todayDate
            clx.updateOne({ _id: dateTime }, { $set: data }, { upsert: true }).then(result => {
              console.log(index, 'inserted', doc.symbol, dateTime)
            })

          }).catch(err => {
            logClx.insertOne({ jobName: 'scrip_data_scraping', type: 'error', msg: `failed to fetch for symbol ${doc.symbol}, compid ${doc.compid_imp}` })
          })
          // } else {
          //   console.log(index, 'past market time, stoping job')
          //   clearInterval(interval)
          //   // db.close()
          // }

          if (currentTime > '1530') {
            stopInterval = true
          }
          if (stopInterval) {
            console.log(index, 'past market time, stoping job')
            clearInterval(interval)
          }

        }, 10000)
      });
    })
  })
  //#endregion})

})
