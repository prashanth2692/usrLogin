//@ts-check
var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/"
const uuid = require('uuid/v1')

const dbConstants = require('../../helpers/dbConstants')
const universitiesList = require('./USNews_MS_CS_top_188.json')

MongoClient.connect(url, function (err, db) {
    if (err) {
        return
    };
    const mydb = db.db('mydb')
    const msUsClx = mydb.collection(dbConstants.collections.msInUsInCs)

    if (universitiesList) {
        universitiesList.forEach((university, index) => {
            const universityName = university[0]
            const location = university[1]
            let rank = university[2]
            const uid = uuid()

            /**
             * try parse rank to number 
             * rank is of format "#91 in Computer Science (tie)"
             */
            try {
                rank = Number(rank.match(/\d+/)[0])
            } catch (err) {
                console.log(err)
            }
            const universityObj = {
                universityName,
                location,
                rank,
                program: "Computer Science",
                rankingSite: "https://www.usnews.com/best-graduate-schools/top-science-schools/computer-science-rankings",
                uid
            }

            msUsClx.updateOne({ universityName }, { $set: universityObj }, { upsert: true }).then(() => {
                console.log(`${index} inserted ${universityName}`)
            }).catch(() => {
                console.log(`${index} failed to insert ${universityName}`)
            })
        })

        console.log('closing connection!')
        db.close()
    } else {
        db.close()
    }
});