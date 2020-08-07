//@ts-check
function response304(res) {
  res.redirect('/login.html')
}

const validURLs = "/login.html|/register|/LoginUser|/RegisterUser|/battery/logsExt|/btn_google_signin_dark_normal_web@2x.png|/login/google"

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
          // set uid in req context
          req.context = {
            uid: doc.uid
          }
          next()
        }
      }).catch(err => {
        response304(res)
      })
    } else {
      // this shouldn't happen!
      next()
    }
  }
}

module.exports = authenticator