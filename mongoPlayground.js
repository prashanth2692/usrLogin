var MongoClient = require('mongodb').MongoClient;
const dbConstants = require('./helpers/dbConstants')
const moment = require('moment')

var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) {
    // res.status(500).send(err.message)
    return
  };
  const mydb = db.db('mydb')
  const txClx = mydb.collection(dbConstants.collections.transactions)

  txClx.find({}).toArray().then(docs => {
    docs.forEach((doc) => {
      if (doc) {
        txClx.updateOne({ _id: doc._id }, { $set: { day: moment(doc.date).format('YYYY-MM-DD') } })
      }
    })
  })

  txClx.aggregate({ $group: { _id: '$broker', tx: { $push: '$$ROOT' } } }, (err, aggregateCursor) => {
    // console.log(typeof result)
    // for (r in result) {
    //   console.log(r)
    // }

    aggregateCursor.each((err, result) => {
      result
    })
    // db.close()
  })
  // .toArray().then().catch(err => {
  //   db.close()
  // })
})