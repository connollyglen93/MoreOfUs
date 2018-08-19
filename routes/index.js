var express = require('express');
var router = express.Router();
var index_controller = require('../controllers/indexController');

//run localhost from CMD  - `set DEBUG=myapp:* & npm start`

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/


router.get('/', index_controller.select_activity_type);

router.get('/profile', index_controller.profile);

module.exports = router;
