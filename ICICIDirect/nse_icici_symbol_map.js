var MongoClient = require('mongodb').MongoClient;
const _ = require('underscore')

const nse_list = require('./output/NSE_EQUITY_L_ARRAY.json')
const icici_list = require('./output/completeDate.json')


const URL = "mongodb://localhost:27017/"
const JOB_NAME = 'nse_icici_symbol_map_processing'

createDBConnection(URL)

function createDBConnection(url) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        console.log("Database created!");
        // db.close();

        // run(db.db('mydb'))
        // db.close()
        run(db)
    });
}

function run(db) {
    const myDb = db.db('mydb')
    const nse_icici_collection = myDb.collection('nse_icici_symbol_map')
    const logsCollection = myDb.collection('logs')
    let symbolMap = {}
    let totalCount = 0
    let noMatchCount = 0

    const totalICICISymbols = (Object.keys(icici_list)).length

    logsCollection.insertOne({ jobName: JOB_NAME, status: 'started', created_date: (new Date()).toUTCString() })
    for (let iSymbol in icici_list) {
        totalCount++
        let match = _.find(nse_list, (nseScrip) => {
            return nseScrip.name_of_company.toUpperCase().indexOf(icici_list[iSymbol].slice(0, icici_list[iSymbol].length * 2 / 3)) > -1
        })

        if (match) {
            symbolMap[match.symbol] = iSymbol
            nse_icici_collection.findOne({ icici: iSymbol }, (err, doc) => {
                if (err) {
                    throw err
                }

                if (!doc) {
                    nse_icici_collection.insertOne(
                        {
                            nse: match.symbol,
                            icici: iSymbol,
                            isin: match.isin_number,
                            name: match.name_of_company,
                            created_date: (new Date()).toUTCString()
                        }, (err, idoc) => {
                            if (idoc) {
                                logsCollection.insertOne(
                                    {
                                        jobName: JOB_NAME,
                                        status: 'success',
                                        message: 'found match',
                                        iciciCode: iSymbol,
                                        created_date: (new Date()).toUTCString()
                                    }
                                )
                            }
                        }
                    )
                }
            })
        } else {
            noMatchCount++
            console.log('no mathc for icici symbol: ', iSymbol)
            logsCollection.insertOne({ jobName: JOB_NAME, status: 'failed', message: 'match not found', iciciCode: iSymbol, created_date: (new Date()).toUTCString() })
        }

        if (totalICICISymbols - 1 == totalCount) {
            logsCollection.insertOne({ jobName: JOB_NAME, status: 'completed', created_date: (new Date()).toUTCString() })
        }

    }

    for (let m in symbolMap) {
        console.log(m, symbolMap[m])
    }

    console.log('total count: ', totalCount)
    console.log('no match count: ', noMatchCount)
}