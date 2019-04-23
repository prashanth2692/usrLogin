//@ts-check
var AdmZip = require('adm-zip');
const path = require('path')
const fs = require('fs')
let moment = require('moment')
const csv = require('csvtojson')
const uuid = require('uuid/v1')
const MongoClient = require('mongodb').MongoClient

// App constants
const JOB_NAME = 'nse_bhavcopy_to_db_trial'
const QUOTES_CLX_NAME = 'dayQuotes_nse_trial'
const JOB_UUID = uuid()
const uri = 'mongodb://localhost:27017/'
const BHAVCOPY_FNAME_DATE_FORMAT = 'DDMMMYYYY'
const SORTABLE_DATE_FORMAT = 'YYYY-MM-DD'
const STANDARD_DATE_FORMAT = 'DD-MM-YYYY'
const MAX_CLOSED_DAYS = 10 // it is observed no trading from 02OCT1997 to 08OCT1997

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
    if (this.counter == 0 && db) {
      console.log('closed db connection')
      // let mydb = db.db('mydb')
      // mydb.collection('logs').insertOne(new log('info', `Finished job ${JOB_NAME} ${JOB_UUID}`)).then(() => {
      //   // db.close()
      // })
    }
  }
}

function main(db) {
  let myDb = db.db('mydb')
  let logsClx = myDb.collection('logs')
  const dayQuotesCollection = myDb.collection(QUOTES_CLX_NAME)
  dayQuotesCollection.find({}).sort({ TIMESTAMP: -1 }).limit(1).toArray((err, latestRecord) => {
    let lastProcessedDate = latestRecord && latestRecord[0] && latestRecord[0].TIMESTAMP
    let startFrom = '03-11-1994' // 01-02-2015
    if (lastProcessedDate) {
      startFrom = moment(lastProcessedDate, SORTABLE_DATE_FORMAT).add(1, 'd').format('DD-MM-YYYY')
    }
    console.log(`Starting processing from date ${startFrom}`)
    logsClx.insertOne(new log('info', `Started job ${JOB_NAME} ${JOB_UUID}`, { startFrom }))
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
  return `cm${moment(date, STANDARD_DATE_FORMAT).format(BHAVCOPY_FNAME_DATE_FORMAT).toUpperCase()}bhav.csv.zip`
}

/**
 * Processes files from given start date, 
 * till current date or till a file found non existent
 * @param {*} startDate 
 * @param {*} db 
 */
async function processZipFilesFromDate(startDate/*format: DD-MM-YYYY */, db) {
  if (!startDate) {
    return false
  }
  let logsClx = db.db('mydb').collection('logs')

  let currentClosedDays = 0
  let currDateObj = moment(startDate, STANDARD_DATE_FORMAT)
  do {
    let fileName = getFileNameFromDate(currDateObj.format(STANDARD_DATE_FORMAT))
    let csvParseStatus = extractCsvFromZip(fileName, false)

    if (csvParseStatus.success) {
      currentClosedDays = 0
      insertCsvStringToDb(csvParseStatus.strData, db)
    } else {
      if (!csvParseStatus.fileParseError) {
        // only if not file parsing error
        console.log(`market closed: ${currentClosedDays} ${fileName}`)
        currentClosedDays++
        if (currentClosedDays == MAX_CLOSED_DAYS) {
          return;
        }
      }
      logsClx.insertOne(new log('error', csvParseStatus.errMsg, { fileName, currentClosedDays }))
    }
    currDateObj = currDateObj.add(1, 'd')
    await new Promise(r => setTimeout(r, 500)) // syncronously waits for 0.5 ms
    // csvContent = extractCsvFromZip(fileName, false)
  } while (currentClosedDays < MAX_CLOSED_DAYS)
}

// extractCsvFromZip('cm03NOV2014bhav.csv.zip', false)
/**
 * Extracts csv file from zip with given name and returns csv as string
 * optionally writes the csv file to disk
 * @param {string} zipFileName name of the zip file to process
 * @param {boolean} writeToFile flag to decide to write the csv from zip file to disk or not
 * @returns {Object} {success: boolean, strData: string(if success is true), errMsg: string(if success is false)}
 */
function extractCsvFromZip(zipFileName /*format: cm03NOV2014bhav.csv.zip */, writeToFile) {
  // let zipFileName = 'cm03NOV2014bhav.csv.zip'
  // check if file with given name exists
  let fileExists = fs.existsSync(path.resolve(__dirname, 'bhavcopy', zipFileName))

  if (fileExists) {
    try {
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

      return { success: true, strData }
    } catch (ex) {
      console.error(`failed to parse file: ${zipFileName}`, ex.message)
      return { success: false, errMsg: ex.message, fileParseError: true }
    }
  } else {
    let errMsg = `file doesn't exist: ${zipFileName}`
    console.warn(errMsg)
    return { success: false, errMsg }
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

/**
 * incomplete (experimental)
 * @param {*} db 
 */
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
  const dayQuotesCollection = mydb.collection(QUOTES_CLX_NAME)
  const logsCollection = mydb.collection('logs')

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
  if (moment(convertedDateStr, SORTABLE_DATE_FORMAT).isValid()) {
    // moment().isValid(<date string>, <format>) checks if the <date string> is valid as per <format>
    scripQuote.TIMESTAMP = convertedDateStr
  } else {
    console.log(`failed date conversion of ${scripQuote.TIMESTAMP}`)
  }
  scripQuote._id = scripQuote.SYMBOL + '_' + scripQuote.SERIES + '_' + scripQuote.TIMESTAMP
  delete scripQuote.field12 // side effect of csvToJson output
  delete scripQuote.field14
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
