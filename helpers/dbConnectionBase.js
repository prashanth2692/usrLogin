//@ts-check
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/"

let promise = new Promise((resolve, reject) => {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) {
            reject(err)
            return
        };

        console.log("Database connection created!");
        resolve(db)
    });
})

module.exports = promise
