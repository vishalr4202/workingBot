const express = require("express");
const ShyamController = require("../controllers/shyamendpoint");
const NewSL = require("../controllers/newSL")
const MultiUserSL = require('../controllers/finalisedSL')
const Options = require("../controllers/options")
const Binance = require ("../controllers/binance")
const router = express.Router();


router.post("/shyamendpoint", ShyamController.shyampoints)
router.post("/executeOrders", MultiUserSL.executeSL)
router.post('/placeOrders',NewSL.placeOrders)
router.get('/dummy',NewSL.getDummy)
router.post('/options',Options.placeOPtions)
router.post('/binance',Binance.placeBinance)

module.exports = router;
