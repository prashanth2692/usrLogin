//@ts-check
var MongoClient = require('mongodb').MongoClient;
const dbConstants = require('./helpers/dbConstants')
const moment = require('moment')

var url = "mongodb://localhost:27017/"

MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
  if (err) {
    return
  };
  const mydb = db.db('mydb')
  let clxName = 'TestCollection'

  let colxs = mydb.listCollections({ name: clxName })
  colxs.each((err, clx) => {
    console.log(clx)

    colxs.hasNext((err, result) => {
      if (result) {
        mydb.dropCollection(clxName).then(result => {
          console.log(result)
          createClxAndVerify(db, mydb, clxName)
        })
        // db.close()
      } else {
        createClxAndVerify(db, mydb, clxName)

      }
    })
  })
})

function createClxAndVerify(db, mydb, clxName) {
  mydb.createCollection(clxName).then(clx => {
    console.log(clx)
    console.log('after create')

    let colxs = mydb.listCollections({ name: clxName })
    colxs.each((err, clx) => {
      console.log(clx)

      colxs.hasNext((err, result) => {
        if (!result) {
          db.close()
        }
      })
    })
  })
}