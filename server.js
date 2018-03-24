var http = require('http')
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto')

// var hash = crypto.createHash('sha256')


// var url = "mongodb://localhost:27017/userLogin"; -> this will create userLogin DB if it doesn't exist
var url = "mongodb://localhost:27017/"
var dbConnection = null
var passwordSalt = 'kjfbgjkhsfbg'

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  var dbo = db.db("mydb");
  dbConnection = dbo
  console.log("Database created!");
  // db.close();
});

var server = http.createServer(function (req, res) {
  if (req.url.indexOf('login') != -1) {
    fs.readFile('index.html', function (err, data) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data)
      res.end()
    })
  } else if (req.url.indexOf('LoginUser') != -1) {
    console.log('user login')
    if (req.method == 'POST') {
      req.on('data', function (chunk) {
        console.log("Received body data:");
        console.log(chunk.toString());
        var params = chunk.toString().split('&')
        var username = params[0].split('=')[1]
        var hashedPassword = crypto.createHash('sha256').update(params[1].split('=')[1] + passwordSalt).digest()
        dbConnection.collection('users').findOne({ userName: username, password: hashedPassword }, function (err, doc) {
          if (doc) {
            // res.write('user logged in!')
            // res.end()
            fs.readFile('dashboard.html', function (err, data) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.write(data)
              res.end()
            })
          } else {
            res.write('wrong credentials!')
            res.end()
          }
        })

      });
    }
  } else if (req.url.indexOf('RegisterUser') != -1) {
    console.log('user login')
    if (req.method == 'POST') {
      req.on('data', function (chunk) {
        console.log("Received body data:");
        console.log(chunk.toString());
        var params = chunk.toString().split('&')
        var username = params[0].split('=')[1]
        dbConnection.collection('users').findOne({ userName: username }, function (err, doc) {
          if (doc) {
            res.write('user already exists!')
            res.end()
          } else {
            var hashedPassword = crypto.createHash('sha256').update(params[1].split('=')[1] + passwordSalt).digest()
            dbConnection.collection('users').insert({ userName: username, password: hashedPassword })
            res.write('Registered Successfully!')
            res.end()
          }
        })

      });
    }
  } else if (req.url.indexOf('register')) {
    fs.readFile('register.html', function (err, data) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data)
      res.end()
    })
  }
  else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(req.url);
    res.end();
  }

})

server.listen(80, () => {
  console.log('listening on port 8885')
})