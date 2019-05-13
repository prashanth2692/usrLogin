const fallbackJobID = require('uuid/v1')()

function logsFactory(jobName, jobId) {
    this.log = function (type, message, moreInfo) {
        this.jobName = jobName
        this.jobId = jobId || fallbackJobID
        this.type = type
        this.message = message
        this.moreInfo = moreInfo
    }
}

logsFactory.prototype.type = {
    info: 'info',
    success: 'success',
    error: 'error'
}

module.exports = logsFactory