//@ts-check
var express = require("express");
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
const URL = require("url");
const url = "mongodb://localhost:27017/";
const dbConstants = require("../helpers/dbConstants");

router.use((req, res, next) => {
  console.log("batteryLogController", req.path);
  next();
});

router.get("/logs", (req, res) => {
  const url_parts = URL.parse(req.url, true);
  const query = url_parts.query;
  const deviceId = Number(query.deviceId) || null;
  const top = Number(query.top) || 100;

  console.log(`getByDeviceId: ${deviceId}`);

  if (!deviceId) {
    res.status(404).send("Bad request. Need deviceId");
    return;
  }

  MongoClient.connect(url, function(err, db) {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const mydb = db.db(dbConstants.dbs.mydb);
    const batteryLogClx = mydb.collection(dbConstants.collections.phoneBatteryLogs);

    batteryLogClx
      .find({ deviceId })
      .toArray()
      .then(docs => {
        db.close();
        res.status(200).json(docs);
      })
      .catch(err => {
        if (err) {
          db.close();
          res.status(500).send(err.message);
          return;
        }
      });
  });
});

router.post("/logs(Ext)?", (req, res) => {
  /**
   * req.body = {
   *  deviceId: string(uniquely identifies a device)
   *  logs: {
   *   _id: string(dta time stamp of battery level log),
   *   value: number(0 - 100)
   *  }
   * }
   */
  const reqBody = req.body;
  if (!reqBody || !reqBody.deviceId || !reqBody.logs || !(reqBody.logs.length > 0)) {
    res.status(404).json({ msg: "Bad request. missing logs or deviceID" });
    return;
  }

  const deviceId = reqBody.deviceId;

  MongoClient.connect(url, function(err, db) {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const mydb = db.db("mydb");
    const batteryLogClx = mydb.collection(dbConstants.collections.phoneBatteryLogs);

    const mappedLogs = reqBody.logs.map(log => ({
      _id: log.dateTime,
      value: log.value,
      deviceId,
    }));

    batteryLogClx
      .insertMany(mappedLogs, { ordered: false })
      .then(doc => {
        db.close();
        res.status(200).json({ msg: "inserted" });
      })
      .catch(err => {
        db.close();
        if (err) {
          db.close();
          res.status(500).send(err.message);
          return;
        }
      });
  });
});

router.get("/devices", (req, res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const mydb = db.db("mydb");
    const batteryLogClx = mydb.collection(dbConstants.collections.phoneBatteryLogs);

    batteryLogClx
      .distinct("deviceId")
      .then(docs => {
        db.close();
        res.status(200).json(docs);
      })
      .catch(err => {
        db.close();
        if (err) {
          db.close();
          res.status(500).send(err.message);
          return;
        }
      });
  });
});

// router.get("/latestLog", (req, res) => {
//   const url_parts = URL.parse(req.url, true);
//   const query = url_parts.query;
//   const deviceId = Number(query.deviceId) || null;

//   MongoClient.connect(url, function(err, db) {
//     if (err) {
//       res.status(500).send(err.message);
//       return;
//     }
//     const mydb = db.db("mydb");
//     const batteryLogClx = mydb.collection(dbConstants.collections.phoneBatteryLogs);

//     batteryLogClx
//       .findOne({ deviceId })
//       .then(docs => {
//         db.close();
//         res.status(200).json(docs);
//       })
//       .catch(err => {
//         db.close();
//         if (err) {
//           db.close();
//           res.status(500).send(err.message);
//           return;
//         }
//       });
//   });
// });

module.exports = router;
