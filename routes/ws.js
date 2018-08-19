var express = require('express');
var router = express.Router();
var user_controller = require('../controllers/wsController');

router.get('/getPort', user_controller.getPort);


router.get('/getNotifications', user_controller.fallback);

router.get('/notifications', user_controller.getNotifications);

module.exports = router;
