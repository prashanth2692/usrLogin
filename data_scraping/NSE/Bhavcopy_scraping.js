//@ts-check

const axios = require('axios')
const moment = require('moment')
const { JSDOM } = require('jsdom')
const fs = require('fs')
const path = require('path')
var MongoClient = require('mongodb').MongoClient;
const uuid = require('uuid/v1')

var url = "mongodb://localhost:27017/"
const NSE_BASE_URL = "https://www.nseindia.com"
const JOB_NAME = 'bhavcopy_file_scraping'
const JOB_UUID = uuid()

MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
  if (err) {
    return
  };
  run(db)
})
// from https://www.nseindia.com/products/content/equities/equities/archieve_eq.htm reports can be downloaded
// sample url: https://www.nseindia.com/ArchieveSearch?h_filetype=eqbhav&date=01-02-2008&section=EQ
// above fetches data for the day 01-02-2008 (01 Feb 2008) of the Bhavcopy report
// 1 feb 2008 retuns two documents

async function getStartDate(db) {
  let mydb = db.db('mydb')
  let scrapingStatusColx = mydb.collection('bhavcopy_scraping_status')
  let docs = await scrapingStatusColx.find({}).sort({ _id: 1 }).toArray()

  let retValue = null
  if (docs && docs.length > 0) {
    retValue = docs[docs.length - 1]
  }

  return retValue
  // .then(docs => {
  //   console.log(docs);
  // })

}

async function run(db) {
  let mydb = db.db('mydb')
  let logsClx = mydb.collection('logs')

  let lastFetchedDate = await getStartDate(db)

  let today = moment()
  let startDate = null
  if (lastFetchedDate) {
    // console.log(lastFetchedDate);
    // today = moment(lastFetchedDate._id).add(1, 'd')
    startDate = moment(lastFetchedDate._id).add(1, 'd')
    // console.log(today.format('YYYY-MM-DD'))

    // to short circuit execution
    // db.close()
    // return
  } else {
    // Scrapping isn't started yet, need to start from the beginning of NSE trading
    // set startDate date to day of NSE trading start date
    startDate = moment('1994-11-03')
  }

  console.log(`fetching from ${startDate.format('YYYY-MM-DD')}`)
  const nseBhavcopyUrl = new URL('https://www.nseindia.com/ArchieveSearch')

  let currDate = startDate
  logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `scraping started from date ${startDate.format('YYYY-MM-DD')}`, status: 'info', craeted_date: new Date() })
  let interval = setInterval(() => {
    // run infinite loop with 10 sec interval to scrap data
    const nseBhavcopyQueryParams = new URLSearchParams({
      h_filetype: 'eqbhav',
      date: currDate.format('DD-MM-YYYY'), // '01-02-2008', //moment().subtract(1, 'd').format('DD-MM-YYYY'),
      // date: '02-02-2008', //moment().subtract(1, 'd').format('DD-MM-YYYY'),
      section: 'EQ'
    })
    nseBhavcopyUrl.search = nseBhavcopyQueryParams.toString()
    console.log(nseBhavcopyUrl.href)
    // axios.get(messageBoardURL.href)

    initiateScraping(nseBhavcopyUrl, moment(currDate), mydb)

    currDate = currDate.add(1, 'd')
    if (currDate.format('YYYY-MM-DD') >= today.format('YYYY-MM-DD')) {
      clearInterval(interval)
      logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `Fetched all docs till date ${today.format('YYYY-MM-DD')}`, status: 'info', craeted_date: new Date() })
    }
  }, 2000)
}

function initiateScraping(nseBhavcopyUrl, targetDate, mydb) {
  let logsClx = mydb.collection('logs')

  //@ts-ignore
  axios.get(nseBhavcopyUrl.href).then(resp => {
    // console.log(resp.data)
    const dom = new JSDOM(resp.data)

    // console.log(dom.table.tr.td.a)
    let aElems = dom.window.document.querySelectorAll('a')
    if (aElems.length > 0) {
      logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `found download links for day ${targetDate.format('YYYY-MM-DD')}`, status: 'info', targetDate: targetDate.format('YYYY-MM-DD'), craeted_date: new Date() })
      aElems.forEach(a => {
        processAnchroTag(a, targetDate, mydb)
      })
    } else {
      console.log(`no files to download: ${targetDate.format('YYYY-MM-DD')}`);
      logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `no files to download for date ${targetDate.format('YYYY-MM-DD')}`, status: 'info', targetDate: targetDate.format('YYYY-MM-DD'), craeted_date: new Date() })
    }
    // parsing received HTML

  }).catch(err => {
    console.log(err.message)
    logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `failed to fetch html for date ${targetDate.format('YYYY-MM-DD')}`, errMsg: err.message, status: 'error', craeted_date: new Date() })
  })
}


function getFile(targetUrl) {
  //@ts-ignore
  return axios.get(targetUrl, {
    responseType: 'stream',
    headers: {
      'Host': 'www.nseindia.com',
      'Connection': 'keep-alive',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://www.nseindia.com/products/content/equities/equities/archieve_eq.htm',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'pointer=1; sym1=NTPC; JSESSIONID=3B15027FB5659E147CFDEF2C451FC932.tomcat1; NSE-TEST-1=1927290890.20480.0000; bm_mi=92607796329D4C1618EE73CA50038F4B~9W2kWdy5hhLxdxsqK3xunXYr0QbeJ/5SHGGDtoDdvbZ2oaLqUtcv+O9TeKHwrLoeovlexGjlE51qf7jM2UMTAp07BActNfC8GHBIgwrAL3P0LWsLA81BzH8af6mPfHUfkK2ttg/j6bIrfFXl9WEIWiA3Z9BVoC0F+/VKmJUWclY4GoVwTiJ4M7Nu2cRW7yDMWIujUoTiGTapiiPmquqyv7Gfun1fWh6hVV1kOGzlG9d3YQTuPqMfCQ5jYb8sBZXp8BkLkX3aeYKp6EWYX0+YgD/A0u9s14+TtXh8+Cn5JX7EkJq1D6uJMOZIuLMLGMphS7ClEq4fWej7zKKpHWig65CZrGHNE1/VK7d8BUSRIDw=; ak_bmsc=37AD2B13EBA74A5D35625AC86A31CBD1B81CDABE4C7000000C36645CF7451874~plNe9XJ/6A9WwpBPNE1iIfGq+Pa7vpB6q9yZA14niexiTsVI86nc7pf3+QFQbYe/Z8cI8olMjJ3ykb0cTHLWggP3wfIs5gpz25ACfZGHL1wV59EWJ0daNC9gryPvOTkny7HOr6cCs9mV6ySSFvgh7gN1RskCadWST5RClc2l89m9g7hIb9N0SAnxJkceEu+nDAFx2uh0jWFVHTnY0vOXSwZ/fRBfHmTjgd2FvaPlO8iK/Uo+rxgc/MuMstsJLc5iKq; bm_sv=EDF00D8D3F9667E1DF8684D1327A64D0~3OextlT5ahigEr/nnK/7LBarDvasUjFcBQDlym2gYd765KqCjTD9W3DUfxPSKtBBX2ea4ta+bUnlQxq3j6/gB/NHdKfnw2wFCFWrnRrqXYafDO0hoSlciUBITFbbdjmQVoqANkB5pn+bCY7bUeP5MQ8FmBdWMFCaAmOPRlPlW/o=; RT="sl=1&ss=1550073240873&tt=1524&obo=0&sh=1550073242411%3D1%3A0%3A1524&dm=nseindia.com&si=f9d53fe4-7cda-47af-ac58-c861be29acac&bcn=%2F%2F36fb78d7.akstat.io%2F&nu=https%3A%2F%2Fwww.nseindia.com%2Fcontent%2Fhistorical%2FEQUITIES%2F2008%2FFEB%2Fcm01FEB2008bhav.csv.zip&cl=1550073396558"'
    }
  })
}

function processAnchroTag(a, today, mydb) {
  let scrapingStatusColx = mydb.collection('bhavcopy_scraping_status')
  let logsClx = mydb.collection('logs')

  console.log(a.href, a.textContent)
  let targetUrl = NSE_BASE_URL + a.href
  let filePath = path.resolve(__dirname, 'bhavcopy', a.textContent)

  // setup writer to write response to a file
  const writer = fs.createWriteStream(filePath)
  writer.on('finish', () => {
    console.log(`file written: ${a.textContent}`)
    updateStatus(today.format('YYYY-MM-DD'), 'success')
  })
  writer.on('error', () => {
    console.log(`error writing to file: ${a.textContent}`)
    logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `failed to write to file ${a.textContent}`, status: 'error', created_date: new Date() })
    updateStatus(today.format('YYYY-MM-DD'), 'failure')
  })

  //@ts-ignore
  getFile(targetUrl).then(resp => {
    resp.data.pipe(writer)

    resp.data.on('end', () => {
      console.log('response completed!')
      // do something!
    })

    resp.data.on('error', () => {
      // do something!
    })
  }).catch(err => {
    console.log(a.textContent, err.message)
    logsClx.insertOne({ jobName: JOB_NAME, jobId: JOB_UUID, message: `failed to download file from target url ${targetUrl}`, status: 'error', created_date: new Date() })
  })

  // helper function
  function updateStatus(date, status) {
    let modifiedDate = new Date()
    scrapingStatusColx.updateOne(
      { _id: date },
      {
        $set: { status, modified_date: modifiedDate },
        $addToSet: { files: { name: a.textContent, url: targetUrl, status } },
        $setOnInsert: { created_date: modifiedDate }
      },
      { upsert: true })
  }
}