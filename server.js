//@ts-check
var fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
var dbConnection = require('./dbConnection').dbConnection
const mongoObjectId = require('mongodb').ObjectID
const moneyControlController = require('./controllers/MoneyControlController')
const holdingsController = require('./controllers/holdingsController')
const chartsController = require("./controllers/chartsController")
const portfolioController = require("./controllers/portfolioController")
const investmentrendController = require('./controllers/investmentTrendController')
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
const uuid = require('uuid/v1')
var cookieParser = require('cookie-parser')

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
let fuelRefeillingModel = mongoose.model('fuelRefilling')


// var hash = crypto.createHash('sha256')

const app = express()
const router = express.Router()
var passwordSalt = 'kjfbgjkhsfbg'

const staticMidlleware = express.static(path.join(__dirname, 'www'), {
  extensions: ['html'] // is required to serve files which are requested without extension
})

app.use(cookieParser())
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

  let queryParams = req.query
  let userName = queryParams.username
  let password = queryParams.password

  dbConnection().collection('users').findOne({ userName }, function (err, doc) {
    if (doc) {
      var hashedPassword = getHasedPassword(password + passwordSalt)
      if (hashedPassword.toString() === doc.password.toString()) {
        // Here the user is authenticated, generate seesion id and send in cookie
        let sessionId = uuid()

        // insert sessionid into db for future refernece
        dbConnection().collection('user_session').insertOne({ userName, sessionId })
        res.cookie('session', sessionId)
        res.redirect('/dashboard')
      } else {
        res.json({ authenticated: false })
      }
    } else {
      res.json({ error: `user with name ${userName} doesn't exist` })
    }
  })
})

router.post('/RegisterUser', function (req, res) {
  let body = req.body
  var username = body.username
  var hashedPassword = getHasedPassword(body.password + passwordSalt)

  dbConnection().collection('users').findOne({ userName: username }, function (err, doc) {
    if (doc) {
      res.write('user already exists!')
      res.end()
    } else {
      dbConnection().collection('users').insert({ userName: username, password: hashedPassword }, function (err, doc) {
        res.redirect('/login.html?status=created')
      })
    }
  })
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
  let sessionId = req.cookies.session
  let mydb = dbConnection()
  mydb.collection('user_session').findOne({ sessionId }).then(doc => {
    // user is authenticated
    if (doc) {
      dbConnection().collection('items').find({ deleted: { $exists: false } }).toArray().then(function (docs) {
        res.status(200).json(docs ? docs : [])
      }).catch(err => {
        res.status(500).send({ msg: 'failed to fetch items' })
      })
    } else {
      res.status(401).json({
        error: 'You must login to see this',
        location: '/login.html'
      })
    }

  }).catch(err => {
    res.status(403).json({
      error: 'You must login to see this',
      location: '/login.html'
    })
  })
})

router.delete('/deleteItem/:id', function (req, res) {
  var url_parts = URL.parse(req.url, true);
  var query = url_parts.query;
  var id = req.params.id;
  console.log(id)
  if (id) {
    dbConnection().collection('items').updateOne({ _id: new mongoObjectId(id) }, { $set: { deleted: true } }).then(result => {
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
  // console.log(req.files)
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

router.post('/uploadFile', (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    // console.log(fields, files)
    let fileKeys = Object.keys(files)
    if (fileKeys.length > 0) {
      let fileObj = files[fileKeys[0]]
      let oldpath = fileObj.path
      if (fileObj.name.indexOf('YE1705_tradebook') > -1) {
        let newpath = path.join(__dirname, '../../', 'Stocks', 'portfolio', 'Zerodha', fileObj.name)
        // console.log(newpath)
        fs.exists(newpath, exists => {
          if (!exists) {
            fs.rename(oldpath, newpath, (err) => {
              if (err) {
                res.status(500).json(err)
              } else {
                res.status(200).end()

                // call python script and then node script to update transactions collection
                // below code is experimental
                console.log('Try to update transactions from zerodha')
                const pythonFromNode = require('./helpers/pythonFromNode.js')
                const insertToDB = require('./Zerodha/insertTransactionsIntoMongo.js')
                const consolidateTxs = require('./portfolio/consolidated_transactions.js')
                pythonFromNode().then((resp) => {
                  insertToDB(dbConnection()).then((resp1) => {
                    console.log('Updated zerodha transactions')
                    consolidateTxs(dbConnection())
                  }).catch(err => {
                    console.error(err)
                  })
                }).catch(err => {
                  console.error(err)
                })
                // end of experimental code
              }
            })
          } else {
            res.end()
          }
        })
      }
    }
  });
  // res.end()
})

let givenPort = Number(process.argv[2]) // fist two will be node and file name respectively
var port = givenPort || 80

app.use('/moneycontrol', moneyControlController)
app.use('/holdings', holdingsController)
app.use('/charts', chartsController)
app.use('/portfolio', portfolioController)
app.use('/investment', investmentrendController)

app.use(router)
app.listen(port, () => {
  console.log('listening on port ', port)
})