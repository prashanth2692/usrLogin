//@ts-check
var fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
var dbConnection = require("./dbConnection").dbConnection;
const mongoObjectId = require("mongodb").ObjectID;
const moneyControlController = require("./controllers/MoneyControlController");
const holdingsController = require("./controllers/holdingsController");
const chartsController = require("./controllers/chartsController");
const portfolioController = require("./controllers/portfolioController");
const investmentTrendController = require("./controllers/investmentTrendController");
const SymbolSearchController = require("./controllers/SymbolSearchController");
const universitiesController = require("./controllers/universitiesController");
const batteryLogController = require("./controllers/batteryLogController");
const loginController = require("./controllers/login");
const clientIPMiddleWare = require("./middlerware/clientIPMiddleware");
const authenteMiddleware = require("./middlerware/authenticator.js");
// var upload_files = require('./file_upload')
var formidable = require("formidable");
require('dotenv').config()
// var http = require('http')
// var fs = require('fs');
var crypto = require("crypto");
// var routes = require('./routes').routes
var path = require("path");
var logger = require("morgan"); // for loggind
const logResponseTime = require("./helpers/response-time-logger");
const URL = require("url");
const uuid = require("uuid/v1");
var cookieParser = require("cookie-parser");
const { argv } = require('yargs')
const { config } = require('./helpers/appConfig')

// if (argv.host) {
config.hostName = argv.host || "localhost"
// }

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/mydb");

var mongooseDB = mongoose.connection;

mongooseDB.on("open", function (err) {
  if (err) throw err;

  console.log("mongoose connection successfull !");
});
// var fuelRefillingSchema = require('./schema/fuelRefill')
// fuelRefillingSchema = new mongoose.Schema({
//   totalAmount: String,
//   odometerReading: String,
//   file: String,
//   dateTime: Date
// })

require("./schema/fuelRefill");
let fuelRefeillingModel = mongoose.model("fuelRefilling");

const app = express();
const router = express.Router();
var passwordSalt = "kjfbgjkhsfbg";

const staticMidlleware = express.static(path.join(__dirname, "www"), {
  extensions: ["html", "png"], // is required to serve files which are requested without extension
});

// middlewares
app.use(cookieParser());
app.use(logResponseTime);
app.use(clientIPMiddleWare);
app.use(authenteMiddleware);
app.use(staticMidlleware);
// app.use("/", express.static(path.join(__dirname, "www")))
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// router.use(logger());
router.use(function (req, res, next) {
  console.log(req.url);
  next();
});

function getHasedPassword(pass) {
  return crypto
    .createHash("sha256")
    .update(pass)
    .digest();
}

router.get("/LoginUser", function (req, res) {
  let queryParams = req.query;
  let userName = queryParams.username;
  let password = queryParams.password;

  dbConnection()
    .collection("users")
    .findOne({ userName }, function (err, doc) {
      if (doc) {
        console.log("login:user doc", doc);
        var hashedPassword = getHasedPassword(password + passwordSalt);
        if (hashedPassword.toString() === doc.password.toString()) {
          // Here the user is authenticated, generate seesion id and send in cookie
          let sessionId = uuid();

          // insert sessionid into db for future refernece
          dbConnection()
            .collection("user_session")
            .insertOne({ uid: doc.uid, sessionId });
          res.cookie("session", sessionId);
          res.redirect("/dashboard");
        } else {
          res.json({ authenticated: false });
        }
      } else {
        res.json({ error: `user with name ${userName} doesn't exist` });
      }
    });
});

router.post("/RegisterUser", function (req, res) {
  let body = req.body;
  let username = body.username;
  let hashedPassword = getHasedPassword(body.password + passwordSalt);
  let userUID = uuid();

  dbConnection()
    .collection("users")
    .findOne({ userName: username }, function (err, doc) {
      if (doc) {
        res.write("user already exists!");
        res.end();
      } else {
        dbConnection()
          .collection("users")
          .insert({ userName: username, password: hashedPassword, uid: userUID }, function (err, doc) {
            res.redirect("/login.html?status=created");
          });
      }
    });
});

router.post("/addItem", function (req, res) {
  const userUID = req.context ? req.context.uid : null;
  // req.on('data', function (chunk) {
  var chunk = req.body.item;
  if (chunk) {
    const item = { itemValue: chunk, uid: userUID };
    dbConnection()
      .collection("items")
      .insertOne(item)
      .then(doc => {
        res.status(200).json(doc.ops[0]);
      })
      .catch(err => {
        res.status(500).send();
      });
    // })
  } else {
    res.status(400).json({ msg: "no item data." });
  }
});

router.get("/getItems", function (req, res) {
  const uid = req.context ? req.context.uid : null;
  let sessionId = req.cookies.session;
  let mydb = dbConnection();
  mydb
    .collection("items")
    .find({ deleted: { $exists: false }, uid })
    .toArray()
    .then(function (docs) {
      res.status(200).json(docs ? docs : []);
    })
    .catch(err => {
      res.status(500).send({ msg: "failed to fetch items" });
    });
  // mydb.collection('user_session').findOne({ sessionId }).then(doc => {
  //   // user is authenticated
  //   if (doc) {
  //   } else {
  //     res.status(401).json({
  //       error: 'You must login to see this',
  //       location: '/login.html'
  //     })
  //   }

  // }).catch(err => {
  //   res.status(403).json({
  //     error: 'You must login to see this',
  //     location: '/login.html'
  //   })
  // })
});

router.delete("/deleteItem/:id", function (req, res) {
  var url_parts = URL.parse(req.url, true);
  var query = url_parts.query;
  var id = req.params.id;
  console.log(id);
  if (id) {
    dbConnection()
      .collection("items")
      .updateOne({ _id: new mongoObjectId(id) }, { $set: { deleted: true } })
      .then(result => {
        res.status(200).send();
      })
      .catch(err => {
        res.status(500).json({ msg: "failed to remove item." });
      });
  }
});

router.post("/fuelRefilling", function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.file.path;
    var newpath = path.join(__dirname, "uploads", files.file.name); //'C:/Users/Your Name/' + files.filetoupload.name;

    fields.file = files.file.name;
    var newFuelRefill = new fuelRefeillingModel(fields);

    newFuelRefill.save(function (err, fuelRefill) {
      if (err) return console.error(err);

      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        res.send("files uploaded");
      });
    });
  });
});

router.post("/fileUpload", function (req, res) {
  // console.log(req.files)
  // upload_files()
  // res.send('received file!')

  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.file.path;
    var newpath = path.join(__dirname, "uploads", files.file.name); //'C:/Users/Your Name/' + files.filetoupload.name;
    fs.rename(oldpath, newpath, function (err) {
      if (err) throw err;
      res.send("files uploaded");
    });
  });
});

router.post("/uploadFile", (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    // console.log(fields, files)
    let fileKeys = Object.keys(files);
    if (fileKeys.length > 0) {
      let fileObj = files[fileKeys[0]];
      let oldpath = fileObj.path;
      if (fileObj.name.indexOf("YE1705_tradebook") > -1) {
        let newpath = path.join(__dirname, "../../", "Stocks", "portfolio", "Zerodha", fileObj.name);
        // console.log(newpath)
        fs.exists(newpath, exists => {
          if (!exists) {
            fs.rename(oldpath, newpath, err => {
              if (err) {
                res.status(500).json(err);
              } else {
                let resData = [];

                // call python script and then node script to update transactions collection
                // below code is experimental
                console.log("Try to update transactions from zerodha");
                const pythonFromNode = require("./helpers/pythonFromNode.js");
                const insertToDB = require("./Zerodha/insertTransactionsIntoMongo.js");
                const consolidateTxs = require("./portfolio/consolidated_transactions.js");
                pythonFromNode()
                  .then(resp => {
                    resData.push("generated zerodha transactions JSON");
                    // console.log(resp)
                    insertToDB(dbConnection())
                      .then(resp1 => {
                        resData.push("inserted zerodha transactions to mongo");
                        console.log("Updated zerodha transactions");
                        consolidateTxs(dbConnection(), req.context ? req.context.uid : null).then(() => {
                          resData.push("updated consolidated transactions");
                          res.status(200).json(resData);
                        });
                      })
                      .catch(err => {
                        console.error(err);
                        res.status(500).json({ error: "failed to update zerodha transactions" });
                      });
                  })
                  .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: "failed to parse transactions" });
                  });
                // end of experimental code
              }
            });
          } else {
            res.json({ info: "file already exists!" });
          }
        });
      }
    }
  });
  // res.end()
});

let givenPort = Number(process.argv[2]); // fist two will be node and file name respectively
var port = givenPort || 80;

// routes
app.use("/moneycontrol", moneyControlController);
app.use("/holdings", holdingsController);
app.use("/charts", chartsController);
app.use("/portfolio", portfolioController);
app.use("/investment", investmentTrendController);
app.use("/symbol", SymbolSearchController);
app.use("/universities", universitiesController);
app.use("/battery", batteryLogController);
app.use("/login", loginController);

// middleware
app.use(router);
app.listen(port, () => {
  console.log("listening on port ", port);
});
