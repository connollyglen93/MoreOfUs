var express = require('express');
var router = express.Router();
var user_controller = require('../controllers/userController');

router.get('/register/:type', user_controller.register);

router.post('/register', user_controller.completeRegistration);

router.get('/login/:activityType', user_controller.loginInit);

router.get('/logout', user_controller.logout);

router.post('/login', user_controller.login);

router.post('/sendInvite', user_controller.sendInvite);

module.exports = router;
