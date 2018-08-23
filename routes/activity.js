var express = require('express');
var router = express.Router();
var act_controller = require('../controllers/activityController');

var checkForSession = function(req){
    var sesh = req.session;
    if(sesh.login === undefined || !sesh.actType === undefined){
        sesh.login = "CharoletteCarte";
        sesh.actType = "Football";
        return false;
    }
    return true;
};
router.use(function(req, res, next) {
    console.log("req.next is a " + typeof req.next);
    let userVerified = checkForSession(req);
    console.log(userVerified);
    console.log(typeof req.next == "function");
    if(userVerified && typeof req.next == "function") {
        return next() // pass control to the next handler
    }else{
        res.redirect('/');
    }    
});

router.get('/create/:type', act_controller.createActivityInit);
router.get('/view/:type/:id', act_controller.viewActivity);
router.post('/create', act_controller.createActivity);
router.get('/acceptInvite/:activityId', act_controller.acceptInvite);
router.get('/review/:type/:id', act_controller.rateUsers);
router.get('/attributeRating/:actUserId/:attributeId/:actId', act_controller.rateAttribute);
router.post('/attributeRating', act_controller.submitRating);

module.exports = router;
