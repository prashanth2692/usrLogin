var AdmZip = require('adm-zip');
const path = require('path')
const fs = require('fs')
// reading archives

let moment = require('moment')
const csv = require('csvtojson')
const MongoClient = require('mongodb').MongoClient
const uuid = require('uuid/v1')

const JOB_NAME = 'nse_bhavcopy_to_db_trial'
const JOB_UUID = uuid()

// Initialize the connection as a promise:
const uri = 'mongodb://localhost:27017/'
MongoClient.connect(uri, function (err, db) {
  if (err) throw err;

  console.log("Database connection created!");
  // insertCsvStringToDb(extractCsvFromZip(false), db)
  main(db)
  // db.close()
});

let monthStrToNumMap = {
  'JAN': '01',
  'FEB': '02',
  'MAR': '03',
  'APR': '04',
  'MAY': '05',
  'JUN': '06',
  'JUL': '07',
  'AUG': '08',
  'SEP': '09',
  'OCT': '10',
  'NOV': '11',
  'DEC': '12'
}

function main(db) {
  let myDb = db.db('mydb')
  let logsClx = myDb.collection('logs')
  const dayQuotesCollection = myDb.collection('dayQuotes_nse')
  dayQuotesCollection.find({}).sort({ TIMESTAMP: -1 }).limit(1).toArray((err, latestRecord) => {
    console.log(latestRecord && latestRecord[0] && latestRecord[0].TIMESTAMP)
    let startFrom = latestRecord[0].TIMESTAMP // 01-02-2015
    let bhavCopyDateFmtStr = moment(startFrom).format('DD-MMM-YYYY').toUpperCase() // 01-FEB-2015
    db.close()
  })
}

extractCsvFromZip(false)
function extractCsvFromZip(writeToFile) {
  let zipFileName = 'cm03NOV2014bhav.csv.zip'
  var zip = new AdmZip(path.resolve(__dirname, 'bhavcopy', zipFileName));
  var zipEntries = zip.getEntries(); // an array of ZipEntry records
  // All the .csv.zip files contain only one file.
  let csvFileEntry = zipEntries[0]
  console.log(csvFileEntry.entryName); // outputs zip entries information
  let fileName = csvFileEntry.entryName
  let data = csvFileEntry.getData()
  let strData = data.toString('utf8')
  // console.log(data.toString('utf8'));
  if (writeToFile) {
    fs.writeFile(path.resolve(__dirname, 'bhavcopy', fileName), data, (err) => {
      if (err) throw err

      console.log(`written to file: ${fileName}`)
    })
  }

  return strData
  // }
  // });
}

/**
  Method to calculate total files with extension \.csv\.zip.
 */
function countZipFiles() {
  function fNameDateFormat(date) {
    return date.format('DDMMMYYYY').toUpperCase()
  }
  let startDate = moment('1994-11-03') //.format('DDMMMYYYY').toUpperCase()
  let currDate = startDate
  let fileCount = 0
  let currDateStr = fNameDateFormat(currDate)
  while (currDateStr != '03APR2019') {
    let fName = `cm${currDateStr}bhav.csv.zip`
    // console.log(fName)
    if (fs.existsSync(path.resolve(__dirname, 'bhavcopy', fName))) {
      fileCount++
    }
    currDate = currDate.add(1, 'd') //.format('DDMMMYYYY').toUpperCase()
    currDateStr = fNameDateFormat(currDate)
  }
  console.log(fileCount)
  console.log(currDateStr)
  console.log(moment().format('DDMMMYYYY').toUpperCase())
}

function insertCsvStringToDb(csvString, db) {
  csv().fromString(csvString).then(data => {
    // csv file resolves to array of objects with first row as keys with corresponding row cell as value

    updateDBWithDayData(data, db)
  })
}


function insertCsvToDb(db) {
  console.log(`Starting job ${JOB_NAME} ${JOB_UUID}`)
  csv().fromFile(path.resolve(__dirname, 'bhavcopy', 'cm01APR2019bhav.csv')).then(data => {
    // csv file resolves to array of objects with first row as keys with corresponding row cell as value

    updateDBWithDayData(data, db)
  })
}

function updateDBWithDayData(dayData, db) {
  if (!dayData || !dayData.length) {
    // no data to process
    return
  }

  const mydb = db.db('mydb')
  const dayQuotesCollection = mydb.collection('dayQuotes_nse')
  const logsCollection = mydb.collection('logs')

  logsCollection.insertOne(new log('info', `Started job ${JOB_NAME} ${JOB_UUID}`))
  // object structure: {'scrip name':{'day': {quote}}}

  let insertCount = {
    counter: 0,
    get increment() {
      this.counter += 1
      return this.counter
    },
    set decrement(db) {
      this.counter -= 1
      if (this.counter == 0) {
        console.log('closed db connection')
        logsCollection.insertOne(new log('info', `Finished job ${JOB_NAME} ${JOB_UUID}`))
        db.close()
      }
    }
  }

  dayData.forEach(scripQuote => {
    let insertPromise = insertQuote(scripQuote, dayQuotesCollection)
    insertCount.increment

    insertPromise.then(data => {
      logsCollection.insertOne(new log('success', `Inserted ${scripQuote.SYMBOL} ${scripQuote.TIMESTAMP}`)).then(() => {
        insertCount.decrement = db
      })
    }).catch(err => {
      logsCollection.insertOne(new log('error', `failed to insert ${scripQuote.SYMBOL} ${scripQuote.TIMESTAMP}`)).then(() => {
        insertCount.decrement = db
      })
    })
  })
}

function insertQuote(scripQuote, clx) {
  // console.log(scripQuote.SYMBOL)
  let convertedDateStr = convertToSortableDateStr(scripQuote.TIMESTAMP)
  if (moment(convertedDateStr, 'YYYY-MM-DD').isValid()) {
    // moment().isValid(<date string>, <format>) checks if the <date string> is valid as per <format>
    scripQuote.TIMESTAMP = convertedDateStr
  }
  scripQuote._id = scripQuote.SYMBOL + '_' + scripQuote.SERIES + '_' + scripQuote.TIMESTAMP
  delete scripQuote.field12 // side effect of csvToJson output
  return clx.updateOne({ _id: scripQuote._id }, { $set: scripQuote }, { upsert: true })
}

function convertToSortableDateStr(nseBhavDateStr) {
  // input format is like '02-JAN-2019'
  // output should be '2019-01-02'
  let tokens = nseBhavDateStr.split('-')
  tokens[1] = monthStrToNumMap[tokens[1]]
  return tokens.reverse().join('-') // this converts to the format 'YYYY-MM-DD'
}

function log(status, message, params) {
  this.jobName = JOB_NAME
  this.jobId = JOB_UUID
  this.status = status
  this.message = message
  this.params = params
}

