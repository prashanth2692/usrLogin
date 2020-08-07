//@ts-check
var MongoClient = require("mongodb").MongoClient;
const URL = require("url");
const url = "mongodb://localhost:27017/";
const dbConstants = require("../../helpers/dbConstants");
const axios = require("axios")
const uuid = require("uuid/v1");
const { config } = require('../../helpers/appConfig')

async function getAccessTokenFromCode(code) {

    const { data } = await axios({
        url: `https://oauth2.googleapis.com/token`,
        method: 'post',
        data: {
            client_id: process.env.GOOLE_LOGIN_CLIENT_ID,
            client_secret: process.env.GOOLE_LOGIN_CLIENT_SECRET,
            redirect_uri: `http://${config.hostName}/login/google`,
            grant_type: 'authorization_code',
            code,
        },
    });
    console.log(data); // { access_token, expires_in, token_type, refresh_token, id_token }
    // id_token is jwt token with user details and expiry
    return data;
};

async function userWithEmailExists(email) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err.message)
                return;
            }
            const mydb = db.db(dbConstants.dbs.mydb);
            const usersClx = mydb.collection(dbConstants.collections.users);

            usersClx
                .find({ email })
                .toArray()
                .then(docs => {
                    if (docs.length > 0) {
                        // user exists
                        resolve(true)
                    } else {
                        // create user
                        resolve(false)
                    }
                    db.close();
                })
                .catch(err => {
                    if (err) {
                        reject(err.message)
                        db.close();
                        return
                    }
                });
        });

    })
}

async function getUserInfo(access_token) {
    try {
        const { data } = await axios({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'get',
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        console.log(data); // { id, email, given_name, family_name }
        return data;
    } catch (e) {
        return e.message
    }
};

async function addGoogleSession(email, tokens) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err.message)
                return;
            }
            const mydb = db.db(dbConstants.dbs.mydb);
            const gSessionClx = mydb.collection(dbConstants.collections.googleSession);
            gSessionClx.updateOne(
                { email }, { $set: tokens }, { upsert: true }
            ).then(result => {
                // user record created
                resolve()
            }).catch(err => {
                reject(err.message)
            }).finally(() => db.close())
        })
    })
}

async function createUser(user) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err.message)
                return;
            }
            const mydb = db.db(dbConstants.dbs.mydb);
            const usersClx = mydb.collection(dbConstants.collections.users);
            usersClx.insertOne({
                uid: user.id,
                email: user.email,
                userName: user.email,
                name: user.name,
                given_name: user.given_name,
                family_name: user.family_name,
                picture: user.picture,
                locale: user.locale
            }).then(result => {
                // user record created
                resolve()
            }).catch(err => {
                reject(err.message)
            }).finally(() => db.close())
        })
    })
}

async function addUserSession(uid) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err.message)
                return;
            }
            const mydb = db.db(dbConstants.dbs.mydb);
            const userSessionClx = mydb.collection(dbConstants.collections.userSession);
            const sessionId = uuid();
            userSessionClx.insertOne({
                uid,
                sessionId
            }).then(result => {
                // user record created
                resolve(sessionId)
            }).catch(err => {
                reject(err.message)
            }).finally(() => {
                db.close()
            })
        })
    })
}

module.exports = async (req, res) => {
    const url_parts = URL.parse(req.url, true);
    const query = url_parts.query;
    const code = query.code

    try {
        const tokens = await getAccessTokenFromCode(code)
        const userData = await getUserInfo(tokens.access_token)
        if (userData && userData.email) {
            const userExists = await userWithEmailExists(userData.email)
            if (!userExists) {
                // create user
                await createUser(userData)
            }
            await addGoogleSession(userData.email, tokens)
            const sessionId = await addUserSession(userData.id)
            res.cookie("session", sessionId);
            res.cookie("email", userData.email);
            res.append("UserId", userData.email)
            res.redirect("/dashboard");
            return
        }

        res.redirect("/login.html?error=unknown_error")
    } catch (e) {
        res.redirect(`/login.html?error=${e.message}`)
    }
};
