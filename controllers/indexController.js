var sesh;
var activityType = require('../models/activity/activityType');
var user = require('../models/users/user');
var activityUser = require('../models/users/activityUser');

exports.select_activity_type = function(req, res) {
  //  return res.send('hi'); var_dump
    if(req.params.id !== undefined){
        var key = req.params.id;
    }else{
        key = 0;
    }
    activityType.find({}).exec(function(err, types){
        if(err){
            console.log('error in select_activity_type');
        }
        res.render('index/activityType', { title: 'MoreOfUs',
            activityTypes: types,layout: false});
    });
};

exports.profile = function(req, res){
    sesh = req.session;
    if(sesh.login === undefined || sesh.actType === undefined){
        res.redirect('/');
        return;
    }
    console.log(sesh);

    let completeProcess = function(actUser, typeObj){
        let attributes = [];

        for(let i = 0; i < typeObj.attribute_names.length; i++){
            attributes[typeObj.attribute_names[i]] = actUser.attributeValues[i];
        }
        actUser.getActivities(function(activities){
            res.render('user/profile', {activityType: sesh.actType, user: sesh.login, attributeValues: attributes, activities: activities});
        });
    };

    let noActUser = false;

    activityUser.findFromUser(sesh.login, sesh.actType, function(err, actUser, userObj){
        if(!actUser){
            if(err) {
                console.log(err);
            }
            noActUser = true;
        }
        activityType.findOne({name : sesh.actType}).exec(function(err, typeObj){
            if(err){
                console.log(err);
            }

            if(noActUser){
                activityUser.create({userId: userObj._id, typeId: typeObj._id}, function (err, actUser) {
                    completeProcess(actUser, typeObj);
                });
            }else{
                completeProcess(actUser, typeObj);
            }
        });
    });
};