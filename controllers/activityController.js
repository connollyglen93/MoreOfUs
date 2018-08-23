var sesh;
var activityType = require('../models/activity/activityType');
var activity = require('../models/activity/activity');
var activityUser = require('../models/users/activityUser');
var moment = require('moment');
var ratingObj = require('../models/users/ratings');


exports.createActivityInit = function(req, res){
    sesh = req.session;
    var type = req.params.type;
    res.render('activity/create', {type: type, csrf : req.csrfToken()});
};

exports.acceptInvite = function(req, res){
    sesh = req.session;
    let id = req.params.activityId;
    if(!id){
        return res.redirect('/profile');
    }
    activityUser.findFromUser(sesh.login, sesh.actType, function(err, actUser, user){
        activity.findOne({_id: id}, function(err, act){
            act.participants.push(actUser._id);
            act.save(function(err){
                act.generateActivityObj(sesh.actType, actUser, false, function(viewObj){
                    return res.render('activity/viewActivity', viewObj);
                })
            });
        });
    })
};

exports.createActivity = function(req, res){
    sesh = req.session;
    var name = req.body.name;
    var typeName = req.body.activityType;
    var numParticipants = req.body.minParticipants;
    var timeOfActivity = moment(req.body.activityDate);
    var location = req.body.locationName;
    var eircode = req.body.eircode;

    var error = false;

    var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/;


    if(format.test(name)){
        error = "Invalid Activity name entered";
    }
    if(format.test(location)){
        error = "Invalid Where entered";
    }
    if(!/[0-9]/.test(eircode)){
        error = "Eircode must contain a number";
    }
    if(numParticipants < 2){
        error = 'Activity must require at least 2 participants';
    }
    if(!timeOfActivity.isValid() || req.body.activityDate.length > 10){
        error = 'Please select a valid date and time for the activity';
    }
    if(timeOfActivity < moment()){
        error = 'Activity date must be set in the future'; 
    }

    timeOfActivity = timeOfActivity.format();
    activityType.findOne({name: typeName}).exec(function(err, typeFound){
        if(err){
          throw err;
        }

        if(!typeFound){
            error = 'Error creating activity';
        }

        if(error){
            return res.render('activity/create', {type: typeName,error: error,formFields: req.body, csrf : req.csrfToken()});
        }


        activityUser.findFromUser(sesh.login, typeName, function(err, actUser){
            if(err){
                res.send(err);
            }

            activity.create({
                name: name,
                type: typeFound._id,
                min_participants: numParticipants,
                location_name: location,
                activity_date: timeOfActivity,
                created_on: moment().format(),
                created_by: actUser._id,
                participants: [actUser._id]
            }, function (err, activityCreated) {
                if (err) {
                    throw err;
                }
                //res.redirect('/activity/view');
                res.redirect('/activity/view/' + typeFound.name + '/' + activityCreated._id);
            });
        });
    });
};

exports.viewActivity = function(req, res){
    sesh = req.session;
    var typeName = req.params.type;
    var activityId = req.params.id;

    var guest = req.query.guest;
    if(typeof guest === 'undefined'){
        guest = false;
    }

    activity.findById(activityId, function(err, actObj){
        if(err){
            throw err;
        }
        if(!actObj){
            return res.redirect('/profile');
        }
        // get the creator
        activityUser.findFromUser(sesh.login, typeName, function(err, actUser){
            if(err){
                throw err;
            }
            if(!actUser){
                return res.redirect('/profile');
            }
            var userId = actUser._id;
            var creatorId = actObj.created_by;

            if(guest){
                actObj.generateActivityObj(sesh.actType, actUser, true, function(viewObj){
                    return res.render('activity/viewActivity', viewObj);
                });
            }else{

                let running = false;
                console.log("Check:" + userId);
                console.log("To see if it is participating in: " + actObj.participants);
                actObj.checkForParticipant(userId, function(exists){
                    console.log(exists);
                    if(!exists && !userId.equals(creatorId)){
                        actUser.notifications.forEach(function(notification){
                        if(notification.activity.equals(activityId)){
                            running = true;
                            actObj.generateActivityObj(sesh.actType, actUser, true, function(viewObj){
                                return res.render('activity/viewActivity', viewObj);
                            });
                        }else{
                            console.log(notification.activity + "!==" +activityId);
                        }
                        });
                        if(!running) {
                            return res.redirect('/profile');
                        }
                    }else{
                        actObj.generateActivityObj(sesh.actType,actUser, false, function(viewObj){
                            return res.render('activity/viewActivity', viewObj);
                        });
                    }
                });
            }
        });
    })
};

exports.rateUsers = function(req, res){
    sesh = req.session;
    console.log(sesh);
    var id = req.params.id;
    var type = req.params.type;
    activity.getById(id, function(err, actObj){
        if(err){
            console.log(err);
            throw err;
        }
        activityType.getById(actObj.type, function(err, actType){
            if(err){
                console.log(err);
                throw err;
            }
            activityUser.findFromUser(sesh.login, type, function(error, actUser, userObj){
                if(error){
                    console.log(err);
                    throw error;
                }
                actObj.getAllParticipants(actUser._id, function(err, participants) {
                    if(err){
                        console.log(err);
                        throw err;
                    }
                    var visualAct = {
                        _id : actObj._id,
                        name: actObj.name,
                        type: actType.name,
                        min_participants: actObj.min_participants,
                        location_name: actObj.location_name,
                        lat: actObj.lat,
                        lng: actObj.lng,
                        activity_date: moment(actObj.activity_date).format('MMMM Do YYYY, h:mm:ss a'),
                        created_on: moment(actObj.created_on).format('MMMM Do YYYY, h:mm:ss a'),
                        raw_activity_date: actObj.activity_date,
                        created_by: actObj.created_by
                    };
                    let done = [];
                    let allUsersRated = [];
                    for(let actUserId in participants){
                        let participant = participants[actUserId];
                        activity.checkForRating(actObj._id, actUser._id, actUserId, function(err, hasRated, indexesRated){
                            if(err){
                                throw err;
                            }
                            if(hasRated && indexesRated.length === 0){
                                participant.hasRated = true;
                                allUsersRated.push('rated');
                            }else{
                                participant.hasRated = false;
                            }
                            done.push('done');
                            participants[actUserId] = participant;
                        })
                    }
                    activityRated = false;
                    let waitForAsync;
                    (waitForAsync = function(){
                        let keys = Object.keys(participants);
                        if(done.length != keys.length){
                            setTimeout(function(){
                                waitForAsync();
                            }, 1000)
                        }else{
                            if(allUsersRated.length === keys.length ) activityRated = true;
                            return res.render('activity/review', {
                                activity: visualAct,
                                activityType:actType,
                                participants: participants,
                                user: {userObj, actUser: actUser},
                                activityRated: activityRated,
                                csrf: req.csrfToken()
                            });
                        }
                    })();
                });
            });
        });
    });
}

exports.rateAttribute = function(req, res){
    sesh = req.session;
    var actUserId = req.params.actUserId;
    var attributeIndex = req.params.attributeId;
    var actId = req.params.actId;
    var type = sesh.actType;
    activityType.findOne({name: type}, function(err, actType){
        if(err){
            throw err;
        }
        let attributeName = actType.attribute_names[attributeIndex];
        activityUser.findFromUser(sesh.login, sesh.actType, function(err, actUser, user){
            if(err){
                throw err;
            }
            activity.checkForRating(actId, actUser._id, actUserId, attributeIndex, function(err, hasRated){
                if(err){
                    throw err;
                }
                return res.render('partials/rateAtt', {
                    participant: actUserId,
                    attributeIndex:attributeIndex,
                    attributeName: attributeName,
                    disabled: hasRated,
                    layout: false
                }); 
            })
            
        });
    });
}

exports.submitRating = function(req, res){
    sesh = req.session;

    let actUserId = req.body.id;
    let attrIndex = req.body.index;
    let rating = req.body.rating;
    let actId = req.body.actId;
    let level = Number(req.body.level);

    console.log({actUserId: actUserId, attrIndex:attrIndex, rating: rating, actId: actId, level : level})
    activityUser.findFromUser(sesh.login, sesh.actType, function(err, actUser, user){
        if(err){
            console.log(err);
            throw error;
        }
        let ratingUserId = actUser._id;
        switch(level){
            case 1: 
                if(!actUserId || !attrIndex || !rating){
                    return res.json({msg:'Insufficient Data'});
                }
                ratingObj.rateAttribute(actUserId, attrIndex, rating, function(err, updatedActUser){
                    if(err){
                        console.log(err);
                        throw err;
                    }
                    activity.recordRating(actId, ratingUserId, actUserId, attrIndex, function(err, updatedAct){
                        if(err){
                            console.log(err);
                            throw err;
                        }
                        return res.json({msg:'User Attribute Rated'});
                    });
                });
            break;
            case 2: 
                if(!actUserId || !rating){
                    return res.json({msg:'Insufficient Data'});
                }
                console.log("a");
                ratingObj.rateUser(actUserId, rating ,function(err, updatedActUser){
                    if(err){
                        console.log(err);
                        throw err;
                    }
                    activity.recordRating(actId, ratingUserId, actUserId, function(err, updatedAct){
                        if(err){
                            console.log(err);
                            throw err;
                        }
                        return res.json({msg:'User Rated'});
                    })
                });
            break;
            case 3: 
                if(!actId || !rating){
                    return res.json({msg:'Insufficient Data'});
                }
                activity.findOne({_id : actId}).exec(function(err, actObj){
                    if(err){
                        throw err;
                    }
                    actObj.getParticipants(function(participants){
                        for(let id in participants){
                            if(ratingUserId.equals(id)){
                                delete participants[id];
                            };
                        }
                        let actUserIds = Object.keys(participants);
                        let actUserIdsLength = actUserIds.length - 1;
                        let done = [];
                        let errors = [];
                        actUserIds.forEach(function(actUserId){
                            if(!ratingUserId.equals(actUserId)){
                                ratingObj.rateUser(actUserId, rating, function(err, updatedActUser){
                                    if(err){
                                        errors.push(err);
                                    }
                                    done.push(actUserId + " done");
                                });
                            }else{
                                done.push(actUserId + " done");
                            }
                        })
                        let waitForAsync;
                        (waitForAsync = function(){
                            if(done.length != actUserIds.length){
                                setTimeout(function(){
                                    waitForAsync();
                                }, 1000)
                            }else if(errors.length){
                                console.log(errors[0]);
                                throw errors[0];
                            }else{
                                activity.recordMultipleRatings(actId, ratingUserId, actUserIds, function(err, updatedAct){
                                    if(err){
                                        console.log(err);
                                        throw err;
                                    }
                                    return res.json({msg:'Users Rated'});
                                });
                            }
                        })();
                    });
                })
                
            break;
            default: 
                console.log(level);
                return res.json({msg:'Failed'});
            break;
        }
    });
}