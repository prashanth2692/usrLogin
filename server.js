var fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
var dbConnection = require('./dbConnection').dbConnection
// var upload_files = require('./file_upload')
var formidable = require('formidable');
// var http = require('http')
// var fs = require('fs');
var crypto = require('crypto')
// var routes = require('./routes').routes
var path = require('path')
var logger = require('morgan') // for loggind

var mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/mydb")
var fuelRefillingSchema = require('./schema/fuelRefill')
var fuelRefeillingModel = mongoose.model('fuelRefilling', fuelRefillingSchema)


// var hash = crypto.createHash('sha256')

const app = express()
const router = express.Router()
var passwordSalt = 'kjfbgjkhsfbg'

const staticMidlleware = express.static(path.join(__dirname, 'www'), {
  extensions: ['html'] // is required to serve files which are requested without extension
})


app.use(staticMidlleware)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// router.use(logger());
router.use(function (req, res, next) {
  console.log(req.url)
  next()
})

function getHasedPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest()
}

router.get('/LoginUser', function (req, res) {
  // if (req.method == 'POST') {
  console.log("Received body data:");

  req.on('data', function (chunk) {
    console.log("Received body data:");
    console.log(chunk.toString());
    var params = chunk.toString().split('&')
    var username = params[0].split('=')[1]
    var hashedPassword = getHasedPassword(params[1].split('=')[1] + passwordSalt)
    dbConnection().collection('users').findOne({ userName: username, password: hashedPassword }, function (err, doc) {
      if (doc) {
        res.redirect('/dashboard')
      } else {
        res.write('wrong credentials!')
        res.end()
      }
    })

  });
  // }
})

router.post('/RegisterUser', function (req, res) {
  if (req.method == 'POST') {
    req.on('data', function (chunk) {
      console.log("Received body data:");
      console.log(chunk.toString());
      var params = chunk.toString().split('&')
      var username = params[0].split('=')[1]
      dbConnection().collection('users').findOne({ userName: username }, function (err, doc) {
        if (doc) {
          res.write('user already exists!')
          res.end()
        } else {
          var hashedPassword = getHasedPassword(params[1].split('=')[1] + passwordSalt)
          dbConnection().collection('users').insert({ userName: username, password: hashedPassword }, function (err, doc) {
            res.write('Registered Successfully!')
            res.end()
          })
        }
      })
    });
  }
})

router.post('/addItem', function (req, res) {
  // req.on('data', function (chunk) {
  var chunk = req.body.item
  if (chunk) {
    dbConnection().collection('items').findOne(function (err, doc) {
      if (err) res.status(500).send(false)

      if (doc) {
        // doc.items.push(chunk.toString())
        dbConnection().collection('items').update({}, { $push: { items: chunk } })
      }
      else {
        dbConnection().collection('items').insert({ items: [chunk] })
      }

      res.status(200).send(true)
    })
  }

  // })

  //node way of doing it
  // res.write('true')
  // res.end()

  // express way
})

router.get('/getItems', function (req, res) {
  dbConnection().collection('items').findOne(function (err, doc) {
    // if (doc) {
    //   // doc.items.push(chunk.toString())
    //   dbConnection().collection('items').update({}, {$push: {items: chunk.toString()}})
    // }
    // else {
    //   dbConnection().collection('items').insert({ items: [chunk.toString()] })
    // }
    // res.writeHead(200, { 'Content-Type': 'application/json' });

    //node way of doing it
    // res.write(JSON.stringify({ response: (doc ? doc : { items: [] }) }))
    // res.end()

    //express way
    // res.set('Content-Type', 'application/json');
    res.status(200).json({ response: (doc ? doc : { items: [] }) })
  })
})

router.post('/fuelRefilling', function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.file.path;
    var newpath = path.join(__dirname, 'uploads', files.file.name)  //'C:/Users/Your Name/' + files.filetoupload.name;

    fields.file = files.file.name
    var newFuelRefill = new fuelRefeillingModel(fields)

    newFuelRefill.save(function (err, fuelRefill) {
      if (err) return console.error(err)

      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        res.send('files uploaded')
      });
    })
  });
})

router.post('/fileUpload', function (req, res) {
  console.log(req.files)
  // upload_files()
  // res.send('received file!')

  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.file.path;
    var newpath = path.join(__dirname, 'uploads', files.file.name)  //'C:/Users/Your Name/' + files.filetoupload.name;
    fs.rename(oldpath, newpath, function (err) {
      if (err) throw err;
      res.send('files uploaded')
    });
  });
})

var port = 8085

app.use(router)
app.listen(port, () => {
  console.log('listening on port ', port)
})