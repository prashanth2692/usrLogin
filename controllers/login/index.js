//@ts-check
var express = require("express");
var router = express.Router();
const google = require("./google")
var MongoClient = require("mongodb").MongoClient;
const URL = require("url");
const url = "mongodb://localhost:27017/";
const dbConstants = require("../../helpers/dbConstants");

router.use((req, res, next) => {
    console.log("loginController", req.path);
    next();
});

router.get("/google", google);

module.exports = router;
