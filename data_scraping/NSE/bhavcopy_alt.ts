import axios, { AxiosError, AxiosResponse } from "axios";
import { createWriteStream, ReadStream } from "fs";
import { join } from "path";
import * as moment from "moment";
import { } from "http-status-codes";

import { MongoClient, Db, Collection } from "mongodb";
import { v1 as uuid } from "uuid";
// 1995-01-04
enum LogType {
    ERROR = "error",
    INFO = "info",
    TEST = "test"
}

interface LogCollectionSchema {
    jobName: string
    jobId: string // use uuid
    message: string
    type: LogType
    createdDate: string // date foramt: 2020-05-28T17:07:18+05:30
}

enum BhavcopyDownloadStatusType {
    DOWNLOAD_STARTED = "download_started",
    DOWNLOAD_COMPLETE = "download_completed",
    DOWNLOAD_FAILED = "download_completed",
    FILE_SAVED = "file_saved",
    FILE_SAVE_FAILED = "file_save_failed",
}

// interface BhavcopyDownloadLog extends LogCollectionSchema {
//     payload?: {
//         date: string // date foramt: 2020-05-28
//         status: BhavcopyDownloadStatusType
//         url?: string
//         fileName?: string
//     }
// }

interface BhavcopyDownloadSchema {
    date: string // date foramt: 2020-05-28
    status: BhavcopyDownloadStatusType
    statusCode?: number // represents the http status code from url response
    url?: string
    fileName?: string
    createdDate: string // date foramt: 2020-05-28T17:07:18+05:30
}

function getISTTimeStamp() {
    return moment().utcOffset("+0530").format() // eg: 2020-05-28T17:07:18+05:30
}



class BhavcopyDownloader {
    mongoClient: MongoClient
    db: Db
    dbName: string = "mydb"
    collectionName: string = "bhavcopyDownload"
    collection: Collection<BhavcopyDownloadSchema>
    // const JOB_NAME = 'bhavcopy_download'
    // const JOB_UUID = uuid()
    sortableDateFormat = 'YYYY-MM-DD'
    bhavcopyFilenaemDateFormat = 'DDMMMYYYY'

    constructor(mongoClient: MongoClient) {
        this.mongoClient = mongoClient
        this.db = mongoClient.db(this.dbName)
        this.collection = this.db.collection<BhavcopyDownloadSchema>(this.collectionName)
    }

    async getLastSuccessDate(): Promise<BhavcopyDownloadSchema | null> {
        // let mydb = db.db('mydb')
        let scrapingStatusColx = this.db.collection<BhavcopyDownloadSchema>(this.collectionName)
        let docs = await scrapingStatusColx.find({ status: BhavcopyDownloadStatusType.FILE_SAVED }).sort({ date: 1 }).toArray()

        let retValue = null
        if (docs && docs.length > 0) {
            retValue = docs[docs.length - 1]
        }
        return retValue
    }

    getURLForDate(date: moment.Moment): string {
        const fileName = this.getFileNameFromDate(date)
        const url = `https://www1.nseindia.com/content/historical/EQUITIES/${date.year()}/${date.format("MMM").toUpperCase()}/${fileName}`
        return url
    }

    getFileNameFromDate(date: moment.Moment) {
        return `cm${date.format(this.bhavcopyFilenaemDateFormat).toUpperCase()}bhav.csv.zip`
    }

    async downloadFile(date: moment.Moment): Promise<AxiosResponse<ReadStream>> {
        const url = this.getURLForDate(date)
        return axios.get(url, {
            responseType: "stream",
            headers: {
                Cookie: "ak_bmsc=0E0F0BCC8F384097E77AA9A23101B444172A9C6E210E0000AC85CE5EA217A91A~plbZUXiBisTfmrTZYvOkbyo/ywbnYF3FqlidXlNXyQAYuqcbANWEMRJWtMg+B7yDFhUpNYjmbo2Su8AK+97QGnyYcJ20ZYVbR2r7LAg3lpcRUYYpUSdUOPgVeRsGrjBdUyLu1E83VWEb+HCu3CbOXygmjeGomOlizzRg5qKFmlWbTjsePzHem8laxnacBWVUg7HLy3XavHcmU91CfrYGsKxTjKAXSlNHs7PAZyjREwzXxV8HKKQ1XkEOpCUUu5dwp3",
                'Referer': 'https://www.nseindia.com/products/content/equities/equities/archieve_eq.htm',
            }
        }).then((response) => {
            this.collection.insertOne({
                date: date.format(this.sortableDateFormat),
                url,
                status: BhavcopyDownloadStatusType.DOWNLOAD_COMPLETE,
                statusCode: response.status,
                createdDate: getISTTimeStamp()
            })
            return response
        }).catch((error) => {
            this.collection.insertOne({
                date: date.format(this.sortableDateFormat),
                url,
                status: BhavcopyDownloadStatusType.DOWNLOAD_FAILED,
                statusCode: error.response.status,
                createdDate: getISTTimeStamp()
            })
            return error
        })
        // .then((response: AxiosResponse) => {
        //     const filePath = join(__dirname, "bhavcopy", "bhavcopy.csv.zip")
        //     response.data.pipe(createWriteStream(filePath))
        // }).catch((e: AxiosError) => {
        //     console.log(e.message, e.response.status)
        // })
    }

    async startDownloading() {
        const lastSuccess = await this.getLastSuccessDate()

        let date
        if (lastSuccess) {
            date = moment(lastSuccess.date).add(1, "day")
        } else {
            date = moment(MARKET_START_DATE)
        }

        console.log(`starting downloading from ${date.format(this.sortableDateFormat)}`)

        const currentDate = moment().format(this.sortableDateFormat)
        while (currentDate != date.format(this.sortableDateFormat)) {
            const fileName = this.getFileNameFromDate(date)
            const status = await this.handleDownloadAndFileSave(date, fileName)
            console.log(`${moment().format()} : ${date.format(this.sortableDateFormat)}: ${status}`)

            // create new date instance and increment it by a day
            date = moment(date).add(1, 'day')
        }
    }

    getFilePath(fileName: string) {
        return join(__dirname, "bhavcopy", fileName)
    }

    async handleDownloadAndFileSave(date: moment.Moment, fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const fileStreamPromise = this.downloadFile(date)
            fileStreamPromise.then(response => {
                const filePath = this.getFilePath(fileName)
                const writeStream = response.data.pipe(createWriteStream(filePath))

                writeStream.on('close', () => {
                    this.collection.insertOne({
                        date: date.format(this.sortableDateFormat),
                        status: BhavcopyDownloadStatusType.FILE_SAVED,
                        fileName,
                        createdDate: getISTTimeStamp()
                    })

                    resolve("Saved data to file")
                })

                writeStream.on('error', (error: Error) => {
                    this.collection.insertOne({
                        date: date.format(this.sortableDateFormat),
                        status: BhavcopyDownloadStatusType.FILE_SAVE_FAILED,
                        fileName,
                        createdDate: getISTTimeStamp()
                    })

                    resolve("failed to save data to file")
                })
            }).catch((error: Error) => {
                resolve("Failed to download file")
            })
        })
    }
}



// async function main(db: MongoClient) {
//     let mydb = db.db('mydb')
//     let bhavDownloadClx = mydb.collection<BhavcopyDownloadSchema>(COLLECTION_NAME)

//     const lastSuccess = await this.getLastSuccessDate(mydb)
//     console.log(lastSuccess)

//     let date
//     if (lastSuccess) {
//         date = moment(lastSuccess.date).add(1, "day")
//     } else {
//         date = moment(MARKET_START_DATE)
//     }

//     const url = this.getURLForDate(date)
//     // logsClx.insertOne({})
// }

const mongoURL = "mongodb://localhost:27017/"
MongoClient.connect(mongoURL, { useNewUrlParser: true }, async function (err, db) {
    if (err) {
        return
    };
    const bhavDownload = new BhavcopyDownloader(db)
    await bhavDownload.startDownloading()
    db.close()
})
// const axios = require("axios")
// const fs = require("fs")
// const path = require("path")


const MARKET_START_DATE = moment('1994-11-03')

// console.log(startDate.format(SORTABLE_DATE_FORMAT))
// console.log(getFileNameFromDate(startDate))
// startDate.add(1, "day")
// console.log(startDate.format(SORTABLE_DATE_FORMAT))
// console.log(getFileNameFromDate(startDate))
// function download

// axios.get("https://www1.nseindia.com/content/historical/EQUITIES/1994/NOV/cm02NOV1994bhav.csv.zip", {
//     responseType: "stream",
//     headers: {
//         Cookie: "ak_bmsc=0E0F0BCC8F384097E77AA9A23101B444172A9C6E210E0000AC85CE5EA217A91A~plbZUXiBisTfmrTZYvOkbyo/ywbnYF3FqlidXlNXyQAYuqcbANWEMRJWtMg+B7yDFhUpNYjmbo2Su8AK+97QGnyYcJ20ZYVbR2r7LAg3lpcRUYYpUSdUOPgVeRsGrjBdUyLu1E83VWEb+HCu3CbOXygmjeGomOlizzRg5qKFmlWbTjsePzHem8laxnacBWVUg7HLy3XavHcmU91CfrYGsKxTjKAXSlNHs7PAZyjREwzXxV8HKKQ1XkEOpCUUu5dwp3",
//         'Referer': 'https://www.nseindia.com/products/content/equities/equities/archieve_eq.htm',
//     }
// }).then(response => {
//     const filePath = join(__dirname, "bhavcopy", "bhavcopy.csv.zip")
//     response.data.pipe(createWriteStream(filePath))
// }).catch((e: AxiosError) => {
//     console.log(e.message, e.response.status)
// })