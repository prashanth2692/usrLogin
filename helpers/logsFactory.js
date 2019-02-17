function logsFactory(jobName) {
    function logs(type, message, moreInfo) {
        this.jobName = jobName
        this.type = type
        this.message = message
        this.moreInfo = moreInfo
    }

    logs.prototype.types = {
        info: 'info',
        success: 'success',
        error: 'error'
    }

    return logs
}

module.exports = logsFactory