var express = require('express');
var router = express.Router();
var docs_controller = require('../controllers/documentationController');

router.get('/algorithm', docs_controller.algorithm);

module.exports = router;
