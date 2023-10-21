const express = require("express");
const ShyamController = require("../controllers/shyamendpoint");
const NewSL = require("../controllers/newSL")
const MultiUserSL = require('../controllers/finalisedSL')
const router = express.Router();


router.post("/shyamendpoint", ShyamController.shyampoints)
router.post("/executeOrders", MultiUserSL.executeSL)
router.post('/placeOrders',NewSL.placeOrders)

module.exports = router;
