var express = require('express');
var router = express.Router();
var searchController = require('../controllers/searchController');

var checkForSession = function(req){
    var sesh = req.session;
    if(sesh.login === undefined || !sesh.actType === undefined){
        sesh.login = "glen.connolly";
        sesh.actType = "Football";
        //return false;
    }
    return true;
};

router.all('*', function (req, res, next) {
    var userVerified = checkForSession(req);
    if(userVerified) {
        next() // pass control to the next handler
    }else{
        res.redirect('/');
    }
});

router.get('/search/:activityId/', searchController.begin);
router.get('/land/:activityId/', searchController.land);

module.exports = router;
