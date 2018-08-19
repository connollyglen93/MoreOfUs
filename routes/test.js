var express = require('express');
var router = express.Router();
var test_controller = require('../controllers/testController');

//run localhost from CMD  - `set DEBUG=myapp:* & npm start`

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/


router.get('/algorithm', test_controller.testAlgorithm);

router.get('/import', test_controller.loadUsers);

module.exports = router;
