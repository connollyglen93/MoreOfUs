var test = require('ava');
var calculator = require('../attribute/calculator');
var ratingObj = require('../users/ratings');
var activityUserObj = require('../users/activityUser');
var userObj = require('../users/user');

test('Test Rating Generation', t => {

    userObj.findOne({username : "glen.connolly"}).exec(function(err, user){
        t.true(user);
        t.false(err);
        activityUserObj.findOne({userId : user._id}).exec(function(err, actUser){
            t.true(actUser)
            t.false(err);
            ratingObj.findOne({actUserId: actUser._id, attrIndex: 0}).exec(function(err, ratingObj){
                t.true(ratingObj);
                t.false(err);
                calculator.generateUpdatedAttributeValue(ratingObj, function(err, newValue){
                    t.false(err);
                    t.pass();
                })
            });
        });
    })

});