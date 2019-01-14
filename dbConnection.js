var MongoClient = require('mongodb').MongoClient;

var dbConnection = null

// var url = "mongodb://localhost:27017/userLogin"; -> this will create userLogin DB if it doesn't exist
var url = "mongodb://localhost:27017/"
var passwordSalt = 'kjfbgjkhsfbg'

MongoClient.connect(url, function (err, db) {
  if (err) throw err;

  // name of the DB to use is: "mydb"
  dbConnection = db.db("mydb");
  // dbConnection = dbo
  console.log("Database created!");
  // db.close();
});

function getConnection(){
  return dbConnection
}


exports.dbConnection = getConnection