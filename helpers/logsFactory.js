//@ts-check
const fallbackJobID = require('uuid/v1')()
const moment = require("moment")

function logsFactory(jobName, jobId) {
    this.log = function (type, message, moreInfo) {
        this.jobName = jobName
        this.jobId = jobId || fallbackJobID
        this.type = type
        this.message = message
        this.moreInfo = moreInfo
        this.date = moment.utc().format("YYYY/MM/DD HH:mm ss Z") // eg: 2019/05/13 18:15 40 +00:00
    }
}

logsFactory.prototype.type = {
    info: 'info',
    success: 'success',
    error: 'error'
}

module.exports = logsFactory