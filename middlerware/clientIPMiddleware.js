//@ts-check
const logFactory = require("../helpers/logsFactory")

const JOB_NAME = "client_IP_logger"
let logger = new logFactory(JOB_NAME)
const DEFAULT_TYPE = logger.type.info
let mydb = null

function getClientIP(req, res, next) {
  let logsCollection = null
  if (!mydb) {
    let dbConnection = require("../dbConnection.js").dbConnection
    let mydb = dbConnection()
    logsCollection = mydb.collection('logs')
  }
  let xForwardedFor_header = req.headers['x-forwarded-for']
  let connectionRemoteAddress = req.connection.remoteAddress
  let socketRemoteAddress = req.socket.remoteAddress
  let connSocketRemoteAddress = req.connection.socket ? req.connection.socket.remoteAddress : null
  var ip = xForwardedFor_header || connectionRemoteAddress || socketRemoteAddress || connSocketRemoteAddress;

  let IPObj = {
    xForwardedFor_header,
    connectionRemoteAddress,
    socketRemoteAddress,
    connSocketRemoteAddress,
    ip
  }

  // console.log('Client IP: ', IPObj)
  if (logsCollection) {
    logsCollection.insertOne(new logger.log(DEFAULT_TYPE, 'Client IP', IPObj))
  }
  next()
}


module.exports = getClientIP