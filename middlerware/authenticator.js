//@ts-check
function response304(res) {
  res.redirect('/login.html')
}

const validURLs = "/login.html|/register|/LoginUser|/RegisterUser"

let mydb = null
function authenticator(req, res, next) {
  if (validURLs.indexOf(req.path) > -1) {
    next()
  } else {
    if (!mydb) {
      let dbConnection = require("../dbConnection.js").dbConnection
      mydb = dbConnection()
    }

    if (mydb) {
      let sessionId = req.cookies.session
      mydb.collection('user_session').findOne({ sessionId }).then(doc => {
        if (!doc) {
          response304(res)
        } else {
          next()
        }
      }).catch(err => {
        response304(res)
      })
    } else {
      next()
    }
  }
}

module.exports = authenticator