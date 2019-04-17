var AdmZip = require('adm-zip');
const path = require('path')
const fs = require('fs')
let moment = require('moment')
const csv = require('csvtojson')
const uuid = require('uuid/v1')
const MongoClient = require('mongodb').MongoClient

// App constants
const JOB_NAME = 'nse_bhavcopy_to_db_trial'
const JOB_UUID = uuid()
const uri = 'mongodb://localhost:27017/'
const BHAVCOPY_FNAME_DATE_FORMAT = 'DDMMMYYYY'
const SORTABLE_DATE_FORMAT = 'DD-MM-YYYY'

// Initialize the connection as a promise:
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

function main(db) {
  let myDb = db.db('mydb')
  let logsClx = myDb.collection('logs')
  const dayQuotesCollection = myDb.collection('dayQuotes_nse')
  dayQuotesCollection.find({}).sort({ TIMESTAMP: -1 }).limit(1).toArray((err, latestRecord) => {
    let lastProcessedDate = latestRecord && latestRecord[0] && latestRecord[0].TIMESTAMP
    let startFrom = '03-11-1994' // 01-02-2015
    if (lastProcessedDate) {
      startFrom = moment(lastProcessedDate).add(1, 'd').format('DD-MM-YYYY')
    }
    processZipFilesFromDate(startFrom, db)
    // let bhavCopyDateFmtStr = moment(startFrom).format('DD-MMM-YYYY').toUpperCase() // 01-FEB-2015
    // db.close()
  })
}
/**
 * returns file name in bhav copy file name format
 * @param {string} date 
 */
function getFileNameFromDate(date/*format: DD-MM-YYYY */) {
  retrun`cm${moment(date).format(BHAVCOPY_FNAME_DATE_FORMAT).toUpperCase()}bhav.csv.zip`
}

function processZipFilesFromDate(startDate/*format: DD-MM-YYYY */, db) {
  if (!startDate) {
    return false
  }
  let currDateObj = moment(startDate)
  do {
    let fileName = getFileNameFromDate(currDateObj.format(SORTABLE_DATE_FORMAT))
    let csvContent = extractCsvFromZip(fileName, false)

    csvContent = extractCsvFromZip(fileName, false)
    insertCsvStringToDb(csvContent, db)
    currDateObj = currDateObj.add(1, 'd')
  } while (csvContent)
}

// extractCsvFromZip('cm03NOV2014bhav.csv.zip', false)
/**
 * Extracts csv file from zip with given name and returns csv as string
 * optionally writed the csv file to disk
 * @param {string} zipFileName name of the zip file to process
 * @param {boolean} writeToFile flag to decide to write the csv from zip file to disk or not
 */
function extractCsvFromZip(zipFileName /*format: cm03NOV2014bhav.csv.zip */, writeToFile) {
  // let zipFileName = 'cm03NOV2014bhav.csv.zip'
  // check if file with given name exists
  let fileExists = fs.existsSync(path.resolve(__dirname, 'bhavcopy', zipFileName))

  if (fileExists) {
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
  } else {
    return false
  }
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
