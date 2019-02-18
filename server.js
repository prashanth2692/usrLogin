var fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
var dbConnection = require('./dbConnection').dbConnection
const mongoObjectId = require('mongodb').ObjectID
const moneyControlController = require('./controllers/MoneyControlController')
const holdingsController = require('./controllers/holdingsController')
const chartsController = require("./controllers/chartsController")
const portfolioController = require("./controllers/portfolioController")
// var upload_files = require('./file_upload')
var formidable = require('formidable');
// var http = require('http')
// var fs = require('fs');
var crypto = require('crypto')
// var routes = require('./routes').routes
var path = require('path')
var logger = require('morgan') // for loggind
const logResponseTime = require("./helpers/response-time-logger");
const URL = require('url')

var mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/mydb")

var mongooseDB = mongoose.connection

mongooseDB.on('open', function (err) {
  if (err) throw err

  console.log('mongoose connection successfull !')
})
// var fuelRefillingSchema = require('./schema/fuelRefill')
// fuelRefillingSchema = new mongoose.Schema({
//   totalAmount: String,
//   odometerReading: String,
//   file: String,
//   dateTime: Date
// })

require('./schema/fuelRefill')
fuelRefeillingModel = mongoose.model('fuelRefilling')


// var hash = crypto.createHash('sha256')

const app = express()
const router = express.Router()
var passwordSalt = 'kjfbgjkhsfbg'

const staticMidlleware = express.static(path.join(__dirname, 'www'), {
  extensions: ['html'] // is required to serve files which are requested without extension
})

app.use(logResponseTime)
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
    dbConnection().collection('items').insertOne({ itemValue: chunk }).then(doc => {
      res.status(200).json(doc.ops[0])
    }).catch(err => {
      res.status(500).send()
    })
    // })
  } else {
    res.status(400).json({ msg: 'no item data.' })
  }

})

router.get('/getItems', function (req, res) {
  dbConnection().collection('items').find({ deleted: { $exists: false } }).toArray().then(function (docs) {
    res.status(200).json(docs ? docs : [])
  }).catch(err => {
    res.status(500).send({ msg: 'failed to fetch items' })
  })
})

router.delete('/deleteItem/:id', function (req, res) {
  var url_parts = URL.parse(req.url, true);
  var query = url_parts.query;
  var id = req.params.id;
  console.log(id)
  if (id) {
    dbConnection().collection('items').updateOne({ _id: mongoObjectId(id) }, { $set: { deleted: true } }).then(result => {
      res.status(200).send()
    }).catch(err => {
      res.status(500).json({ msg: 'failed to remove item.' })
    })
  }
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

app.use('/moneycontrol', moneyControlController)
app.use('/holdings', holdingsController)
app.use('/charts', chartsController)
app.use('/portfolio', portfolioController)
app.use(router)
app.listen(port, () => {
  console.log('listening on port ', port)
})