const axios = require('axios')
var MongoClient = require('mongodb').MongoClient;
// const moment = require('moment')
const momentTz = require('moment-timezone')

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
  const clx = mydb.collection('rcom_seconds_log')

  const moment = momentTz().tz('asia/calcutta')
  const todayDate = moment.format('YYYY-MM-DD')
  //#endregion})
  let interval = setInterval(() => {
    let currentTime = momentTz().tz('asia/calcutta').format('HHmm')
    if (currentTime < '1530') {
      axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${rCom_COmpiID}`).then(resp => {
        let data = resp.data.data
        // console.log(data.pricecurrent, data.VOL)

        let dateTime = todayDate + ' ' + data[0]
        clx.updateOne({ _id: dateTime }, { $set: data }, { upsert: true }).then(result => {
          console.log('inserted', dateTime)
        })

      })
    } else {
      console.log('past market time, stoping job')
      clearInterval(interval)
      db.close()
    }

  }, 5000)
})
