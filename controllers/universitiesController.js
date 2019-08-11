//@ts-check
var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient;
const URL = require('url')
const url = "mongodb://localhost:27017/"
const dbConstants = require('../helpers/dbConstants')

router.use((req, res, next) => {
    console.log('SymbolSearchController')
    next()
})

router.get('/list', (req, res) => {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            res.status(500).send(err.message)
            return
        };
        const mydb = db.db('mydb')
        const msUsClx = mydb.collection(dbConstants.collections.msInUsInCs)

        msUsClx.find({}).toArray((err, docs) => {
            if (err) {
                db.close()
                res.status(500).send(err.message)
                return
            }
            db.close()
            res.status(200).json(docs)
        })
    });

})

router.get('/getById', (req, res) => {
    const url_parts = URL.parse(req.url, true)
    const query = url_parts.query
    const uid = query.uid

    console.log(`getbyId: ${uid}`)

    if (!uid) {
        res.status(404).send('Bad request. Need uid')
        return
    }

    MongoClient.connect(url, function (err, db) {
        if (err) {
            res.status(500).send(err.message)
            return
        };
        const mydb = db.db(dbConstants.dbs.mydb)
        const universitiesClx = mydb.collection(dbConstants.collections.msInUsInCs)

        universitiesClx.findOne({ uid }).then((doc) => {
            if (err) {
                db.close()
                res.status(500).send(err.message)
                return
            }
            db.close()
            res.status(200).json(doc)
        })
    });
})

router.get('/notes', (req, res) => {
    const url_parts = URL.parse(req.url, true)
    const query = url_parts.query
    const uid = query.uid

    console.log(`getbyId: ${uid}`)

    if (!uid) {
        res.status(404).send('Bad request. Need uid')
        return
    }


    MongoClient.connect(url, function (err, db) {
        if (err) {
            res.status(500).send(err.message)
            return
        };
        const mydb = db.db(dbConstants.dbs.mydb)
        const universityNotesClx = mydb.collection(dbConstants.collections.universityNotes)

        universityNotesClx.findOne({ uid }).then((doc) => {
            if (err) {
                db.close()
                res.status(500).send(err.message)
                return
            }
            db.close()
            res.status(200).json(doc)
        })
    });

})


router.post('/notes', (req, res) => {
    // TODo: deleting a proprties won't work with this implementation
    // each note corresponds to university in universities list
    // const url_parts = URL.parse(req.url, true)
    // const query = url_parts.query
    // const uid = query.uid


    const reqBody = req.body
    if (!reqBody || !reqBody.uid) {
        res.status(404).send('Bad request. missing uid in body')
        return
    }

    const uid = reqBody.uid


    MongoClient.connect(url, function (err, db) {
        if (err) {
            res.status(500).send(err.message)
            return
        };
        const mydb = db.db('mydb')
        const universityNotesClx = mydb.collection(dbConstants.collections.universityNotes)

        console.log(reqBody)
        delete reqBody._id // patch to not pass _id for update
        universityNotesClx.updateOne({ uid }, { $set: reqBody }, { upsert: true }).then((doc) => {
            if (err) {
                db.close()
                res.status(500).send(err.message)
                return
            }
            db.close()
            res.status(200).json('updaed')
        })
    });

})

module.exports = router