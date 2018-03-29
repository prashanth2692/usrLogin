var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

var dbConnection = null
var url = "mongodb://localhost:27017/"

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  var dbo = db.db("mydb");
  dbConnection = dbo
  console.log("Database created!");
  // db.close();
});



var routes = {
  '/login': function (req, res) {
    fs.readFile('index.html', function (err, data) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data)
      res.end()
    })
  },
  '/dashboard.js': function (req, res) {
    fs.readFile('dashboard.js', function (err, data) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.write(data)
      res.end()
    })
  },
  '/addItem': function (req, res) {
    req.on('data', function (chunk) {
      dbConnection.collection('items').findOne(function (err, doc) {
        if (doc) {
          // doc.items.push(chunk.toString())
          dbConnection.collection('items').update({}, { $push: { items: chunk.toString() } })
        }
        else {
          dbConnection.collection('items').insert({ items: [chunk.toString()] })
        }
      })

    })

    res.write('true')
    res.end()
  },
  '/getItems': function (req, res) {
    dbConnection.collection('items').findOne(function (err, doc) {
      // if (doc) {
      //   // doc.items.push(chunk.toString())
      //   dbConnection.collection('items').update({}, {$push: {items: chunk.toString()}})
      // }
      // else {
      //   dbConnection.collection('items').insert({ items: [chunk.toString()] })
      // }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ response: (doc ? doc : { items: [] }) }))
      res.end()
    })
  }
}

exports.routes = routes