var mongoose = require('mongoose');
var activityType = require('../activity/activityType');
var moment = require('moment');

var Schema = mongoose.Schema;

var ratedUser = new Schema({
    id: {type: Schema.Types.ObjectId, required:false, ref: 'ActivityUser'},
    attribIndexes : [{type: Number}],
    _id: {id:false}
  });

var rating = new Schema({
  participantId: {type: Schema.Types.ObjectId, required:false, ref: 'ActivityUser'},
  ratedUsers : [ratedUser],
  _id: {id:false}
});

var ActivitySchema = new Schema(
    {
        name: {type: String, required: true, max: 100},
        type: {type: Schema.Types.ObjectId, required: true, ref: 'ActivityType'},
        min_participants: {type: Number, required: true},
        location_name: {type: String, required: true},
        lat: {type: Number, required: false},
        lng: {type: Number, required: false},
        activity_date: {type: Date, required: true},
        created_on: {type: Date, required: true},
        created_by: {type: Schema.Types.ObjectId, required:true, ref: 'ActivityUser'},
        participants: [{type: Schema.Types.ObjectId, required: true, ref: 'ActivityUser'}],
        ratings: [rating]
    }
    , { collection: 'activity'});

    ActivitySchema.statics.getById = function(id, _callback){
        self = this;
        self.findOne({_id : id}).exec(function(err, actObj){
            if(err){
                return _callback(err, actObj);
            }
            _callback(false, actObj);
        });
    }

//            activity.checkForAttribRating(actId, actUser._id, actUserId, attributeIndex, function(err, hasRated, unratedAttribs){

    ActivitySchema.statics.checkForRating = function(...params){
        let _callback = params.pop();
        let id = params.shift();
        let userRating = params.shift();
        let userRated = params.shift();
        this.getById(id, function(err, act){
            if(err){
                _callback(err, act);
            }
            console.log("Params");
            console.log(params);
            if(params.length){
                let attribIndex = params.shift();
                console.log('Attribute Check');
                act.checkForAttribRating(userRating, userRated, attribIndex, _callback);
            }else{
                console.log('User Check');
                act.checkForUserRating(userRating, userRated, _callback);
            }
        })
    };

    ActivitySchema.methods.checkForAttribRating = function(userRating, userRated, attribIndex, _callback){
        self = this;
        let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
        if(userHasRated.length === 0 || typeof userHasRated === 'undefined'){ //if user hasn't rated a user
            return _callback(false, false);
        }else{ //if user has rated a user
            userHasRated = userHasRated[0];
            let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
            if(userHasRatedUser.length === 0 ||  typeof userHasRatedUser === 'undefined'){ //if user hasn't rated this user
                return _callback(false, false);
            } //if user has rated this user
            userHasRatedUser = userHasRatedUser[0];
            userHasRatedUser.attribIndexes.forEach(function(attribIndexRated){
                if(attribIndexRated == attribIndex){
                    _callback(false, true);
                }
            })
            _callback(false, false);
        }
    }
/*      Array.prototype.remove = function() {
        var what, a = arguments, L = a.length, ax;
        while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    }; //create ability to remove attribIndex from attribIndexes by value  */

    ActivitySchema.methods.checkForUserRating = function(userRating, userRated, _callback){
        let self = this;
        activityType.findOne({_id : self.type}).exec(function(err, type){
            if(err){
                _callback(err, false, false);
            }
            function remove(array, element) {
                const index = array.indexOf(element);
                array.splice(index, 1);
            }
            let attribCount = type.attribute_names.length;
            let attribIndexes = [];
            for(let i = 0; i < attribCount; i++){
                attribIndexes.push(i);
            }

            let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
            if(!userHasRated.length || userHasRated.length === 0){ //if user hasn't rated a user
                return _callback(false, false, attribIndexes);
            }else{ //if user has rated a user
                userHasRated = userHasRated[0];
                let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
                console.log(userHasRatedUser.length);
                if(!userHasRatedUser.length || userHasRatedUser.length === 0){ //if user hasn't rated this user
                    return _callback(false, false, attribIndexes);
                } //if user has rated this user
                console.log(userHasRatedUser);
                userHasRatedUser = userHasRatedUser[0];
                userHasRatedUser.attribIndexes.forEach(function(attribIndexRated){
                    remove(attribIndexes, attribIndexRated);
                })
                _callback(false, true, attribIndexes);
            }
        });
    }

    ActivitySchema.statics.recordRating = function(...params){
        let _callback = params.pop();
        let id = params.shift();
        /* params =  userRating, userRated, [attribId] */
        let userRating = params.shift();
        let userRated = params.shift();
        console.log('recording ratings now!');
        this.getById(id, function(err, act){
            if(err){
                _callback(err, act);
            }
            if(params.length){
                let attribIndex = params.shift();
                console.log('Attribute Recording');
                act.markAttributeRating(userRating, userRated, attribIndex, _callback);
            }else{
                console.log('User Recording');
                act.markUserRating(userRating, userRated, _callback);
            }
        })
    }

    ActivitySchema.statics.recordMultipleRatings = function(...params){
        let _callback = params.pop();
        let id = params.shift();
        /* params =  userRating, userRated, [attribId] */
        let userRating = params.shift();
        let usersRated = params.shift();
        console.log('recording ratings now!');
        this.getById(id, function(err, act){
            if(err){
                _callback(err, act);
            }
            let allRatings = [];
            usersRated.forEach(function(userRated){
                console.log('Multiple User Recording');
                act.markUserRatingWithoutSave(userRating, userRated, function(err, newUserRatings){
                    allRatings.push(newUserRatings);
                });
            });
            let waitForAsync;
                        (waitForAsync = function(){
                            if(allRatings.length != usersRated.length){
                                setTimeout(function(){
                                    waitForAsync();
                                }, 1000)
                            }else{

                                let allRatedUsers = [];
                                let newAllRatings = [];
                                let participantIdTemp = 0;
                                allRatings.forEach(function(returnedRating){
                                    allRatedUsers.push(returnedRating.ratedUsers);
                                    participantIdTemp = returnedRating.participantId;
                                });
                                newAllRatings.push({participantId: participantIdTemp, ratedUsers: allRatedUsers});
                                allRatings = newAllRatings;
                                
                                let newRatings = [];
                                if(act.ratings.length){
                                    let ratingExists = false;
                                    allRatings.forEach(function(returnedRating){
                                        act.ratings.forEach(function(rating){
                                            if(rating.participantId.equals(returnedRating.participantId)){ 
                                                rating = returnedRating;
                                                ratingExists = true;
                                            }
                                        });
                                        if(!ratingExists && newRatings.indexOf(returnedRating) === -1){
                                            newRatings.push(returnedRating)
                                        }
                                    })
                                    act.ratings.forEach(function(rating){
                                        newRatings.push(rating);
                                    });
                                    act.ratings = newRatings;
                                }else{
                                    act.ratings = allRatings;
                                }
                                console.log({act : act, actRatings: act.ratings});
                                act.save(function(err, updatedActivity){
                                    _callback(err, updatedActivity);
                                })
                            }
                        })();
        })
    }

    ActivitySchema.methods.markAttributeRatingWithoutSave = function(userRating, userRated, attribIndex, _callback){
        console.log('Attribute Recording Woop');
        self = this;
        console.log(self);
        let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
        if(!userHasRated.length){ //if user hasn't rated a user
            userHasRated = {participantId : userRating, ratedUsers : [{id: userRated, attribIndexes: [attribIndex]}]};
        }else{ //if user has rated a user
            userHasRated = userHasRated[0];
            let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
            if(!userHasRatedUser.length){ //if user hasn't rated this user
                userHasRatedUser = {id : userRated, attribIndexes : [attribIndex]};
                userHasRated.ratedUsers.push(userHasRatedUser);
            }else{ //if user has rated this user
                userHasRatedUser = userHasRatedUser[0];
                userHasRatedUser.attribIndexes.push(attribIndex);
            }
        }

        return _callback(err, userHasRated);

    }

    ActivitySchema.methods.markUserRatingWithoutSave = function(userRating, userRated, _callback){
        console.log('User Recording Woop');
        let self = this;
        activityType.findOne({_id : self.type}).exec(function(err, type){
            if(err){
                _callback(err, false);
            }

            let attribCount = type.attribute_names.length;
            let attribIndexes = [];
            for(let i = 0; i < attribCount; i++){
                attribIndexes.push(i);
            }
            let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
            if(!userHasRated.length){ //if user hasn't rated a user
                let nestedNestedRating = {id:userRated, attribIndexes: attribIndexes};
                let nestedRatedUsers = [];
                nestedRatedUsers.push(nestedNestedRating);
                console.log({nestedRatedUsers: nestedRatedUsers});
                userHasRated = {participantId : userRating, ratedUsers : nestedRatedUsers};
            }else{ //if user has rated a user
                userHasRated = userHasRated[0];
                let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
                if(!userHasRatedUser.length){ //if user hasn't rated this user
                    userHasRatedUser = {id : userRated, attribIndexes : attribIndexes};
                    userHasRated.ratedUsers.push(userHasRatedUser);
                }else{ //if user has rated this user
                    userHasRatedUser = userHasRatedUser[0];
                    userHasRatedUser.attribIndexes = attribIndexes;
                }
            }
  
            return _callback(err, userHasRated);
        });
    }


    ActivitySchema.methods.markAttributeRating = function(userRating, userRated, attribIndex, _callback){
        console.log('Attribute Recording Woop');
        self = this;
        console.log(self);
        let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
        if(!userHasRated.length){ //if user hasn't rated a user
            userHasRated = {participantId : userRating, ratedUsers : [{id: userRated, attribIndexes: [attribIndex]}]};
        }else{ //if user has rated a user
            userHasRated = userHasRated[0];
            let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
            if(!userHasRatedUser.length){ //if user hasn't rated this user
                userHasRatedUser = {id : userRated, attribIndexes : [attribIndex]};
                userHasRated.ratedUsers.push(userHasRatedUser);
            }else{ //if user has rated this user
                userHasRatedUser = userHasRatedUser[0];
                userHasRatedUser.attribIndexes.push(attribIndex);
            }
        }

        let newRatings = [];
        if(self.ratings.length){
            let ratingExists = false;
            self.ratings.forEach(function(rating){
                 if(!rating.participantId.equals(userRating)){ 
                    newRatings.push(rating);
                }else{ //if user has already rated a user
                    newRatings.push(userHasRated);
                    ratingExists = true;
                }
            })
            if(!ratingExists){
                newRatings.push(userHasRated)
            }
            self.ratings = newRatings;
        }else{
            self.ratings.push(userHasRated);
        }

        self.save(function(err, updatedActivity){
            _callback(err, updatedActivity);
        })

    }

    ActivitySchema.methods.markUserRating = function(userRating, userRated, _callback){
        console.log('User Recording Woop');
        let self = this;
        activityType.findOne({_id : self.type}).exec(function(err, type){
            if(err){
                _callback(err, false);
            }

            let attribCount = type.attribute_names.length;
            let attribIndexes = [];
            for(let i = 0; i < attribCount; i++){
                attribIndexes.push(i);
            }
            let userHasRated = self.ratings.filter(rating => rating.participantId.equals(userRating));
            if(!userHasRated.length){ //if user hasn't rated a user
                let nestedNestedRating = {id:userRated, attribIndexes: attribIndexes};
                let nestedRatedUsers = [];
                nestedRatedUsers.push(nestedNestedRating);
                console.log({nestedRatedUsers: nestedRatedUsers});
                userHasRated = {participantId : userRating, ratedUsers : nestedRatedUsers};
            }else{ //if user has rated a user
                userHasRated = userHasRated[0];
                let userHasRatedUser = userHasRated.ratedUsers.filter(ratedUser => ratedUser.id.equals(userRated));
                if(!userHasRatedUser.length){ //if user hasn't rated this user
                    userHasRatedUser = {id : userRated, attribIndexes : attribIndexes};
                    userHasRated.ratedUsers.push(userHasRatedUser);
                }else{ //if user has rated this user
                    userHasRatedUser = userHasRatedUser[0];
                    userHasRatedUser.attribIndexes = attribIndexes;
                }
            }
  
            let newRatings = [];
            if(self.ratings.length > 0){
                let ratingExists = false;
                self.ratings.forEach(function(rating){
                     if(!rating.participantId.equals(userRating)){ 
                        newRatings.push(rating);
                    }else{ //if user has already rated a user
                        newRatings.push(userHasRated);
                        ratingExists = true;
                    }
                })
                if(!ratingExists){
                    newRatings.push(userHasRated)
                }
                self.ratings = newRatings;
            }else{
                self.ratings.push(userHasRated);
            }
            console.log('Time to save');
            console.log({actToSave: self});
            console.log('Ratings to save');
            console.log({ratingsToSave: self.ratings});
            self.save(function(err, updatedActivity){
                _callback(err, updatedActivity);
            })

 /*            let attribCount = type.attribute_names.length;

            let ratingInstance = self.ratings.filter(rating => rating.participantId.equals(userRating));
            if(!ratingInstance.length){ //if user has not rated any user for this activity
                let ratedUsers = [];
                let ratedUser = {};
                ratedUser.id = userRated;
                ratedUser.attribIndexes = [];
                for(let i = 0; i < attribCount; i++){
                    ratedUser.attribIndexes.push(attribCount);
                }
                ratedUsers.push(ratedUser);
                ratingInstance = {participantId: userRating, ratedUsers: ratedUsers};
                self.ratings.push(ratingInstance);

            }else{ //if user has rated a user for this activity
                let ratingInstanceRating = ratingInstance.filter(nestedRating => nestedRating.id.equals(userRated));
                if(ratingInstanceRating.length){ // if user has rated this user in this activity
                    ratingInstanceRating.attribIndexes = [];
                    for(let i = 0; i < attribCount; i++){
                        ratingInstanceRating.attribIndexes.push(attribCount);
                    }
                    self.ratings.forEach(function(existingRatingInstance){
                        if(existingRatingInstance.participantId.equals(userRating)){
                            existingRatingInstance.ratedUsers.forEach(function(userRated){
                                if(userRated.id.equals(userRated)){
                                    userRated = ratingInstanceRating;
                                }
                            })
                        }
                    })
                }else{ //if user has rated someone in this activity but not this user
                    let attribIndexes = [];
                    for(let i = 0; i < attribCount; i++){
                        attribIndexes.push(attribCount);
                    }
                    let ratedUser = {id : userRated, attribIndexes : attribIndexes};
                    ratingInstance.ratedUsers.push(ratedUser);
                    self.ratings.forEach(function(existingRatingInstance){
                        if(existingRatingInstance.participantId.equals(userRating)){
                            existingRatingInstance = ratingInstance;
                        }
                    })
                }

            }
            self.save(function(err, updatedActivity){
                _callback(err, updatedActivity);
            }) */
        });
    }

    ActivitySchema.methods.checkForParticipant = function(userId, _callback){
        for(var participant in this.participants){
            if(userId.equals(this.participants[participant])){
                _callback(true);
                return;
            }
        }
        _callback(false);
    };

    ActivitySchema.methods.generateActivityObj = function(actType, actUser, readOnly, _callback){
        actObj = this;
        var activityUser = require('../users/activityUser');
        actObj.getParticipants(function(participants) {
            activityType.findOne({name: actType}).exec(function (err, typeObj) {
    
                actObj.activity_date = moment(actObj.activity_date).format('MMMM Do YYYY, h:mm:ss a');
                actObj.created_on = moment(actObj.created_on).format('MMMM Do YYYY, h:mm:ss a');
    
                console.log(moment(actObj.activity_date).format('MMMM Do YYYY, h:mm:ss a'));
    
                actObj.getVisualAct(actType, function(visualAct){
                    let onlyRead = false;
                    if (readOnly) {
                        onlyRead = true;
                    }
        
                    _callback({
                        activity: visualAct,
                        user: actUser,
                        participants: participants,
                        attributeNames: typeObj.attribute_names,
                        readOnly: onlyRead
                    });
                })
            });
        });
    };

    ActivitySchema.methods.getVisualAct = function(actType, _callback){
        var visualAct = {
            _id : actObj._id,
            name: actObj.name,
            type: actType,
            min_participants: actObj.min_participants,
            location_name: actObj.location_name,
            lat: actObj.lat,
            lng: actObj.lng,
            activity_date: moment(actObj.activity_date).format('MMMM Do YYYY, h:mm:ss a'),
            created_on: moment(actObj.created_on).format('MMMM Do YYYY, h:mm:ss a'),
            raw_activity_date: actObj.activity_date,
            created_by: actObj.created_by
        };
        _callback(visualAct);
    };

    ActivitySchema.methods.getParticipants = function(_callback){
        var participants = {};
        var ids = [];
        var actUserIds = [];
        var self = this;
        self.participants.forEach(function(participant){
            ids.push(participant);
        });

        var activityUser = require('../users/activityUser');
        activityUser.find({'_id' :{ $in: ids}}, function(err, actUsers){
            actUsers.forEach(function(actUser){
                actUserIds.push(actUser.userId);
            });
            activityUser.getUsers(actUserIds, function(err, users){
                if(err){
                    throw err;
                }
                actUsers.forEach(function(actUser){
                    users.forEach(function(user){
                        if(user._id.equals(actUser.userId)){
                            if(self.created_by.equals(actUser._id)) {
                                participants[actUser._id] = {
                                    attributes: actUser.attributeValues,
                                    name: user.username,
                                    creator: true
                                };
                            }else{
                                participants[actUser._id] = {
                                    attributes: actUser.attributeValues,
                                    name: user.username,
                                    creator: false
                                };
                            }
                        }
                    });
                });
                _callback(participants);
            });
        });
    };

    ActivitySchema.methods.getAllParticipants = function(userId, _callback){
        var participants = {};
        var ids = [];
        var actUserIds = [];
        var self = this;
        self.participants.push(self.created_by);
        self.participants.forEach(function(participant){
            if(!participant.equals(userId)){
                ids.push(participant);
            }
        });

        var activityUser = require('../users/activityUser');
        activityUser.find({'_id' :{ $in: ids}}, function(err, actUsers){
            if(err){
                _callback(err);
            }
            actUsers.forEach(function(actUser){
                actUserIds.push(actUser.userId);
            });
            activityUser.getUsers(actUserIds, function(err, users){
                if(err){
                    _callback(err);
                }
                actUsers.forEach(function(actUser){
                    users.forEach(function(user){
                        if(user._id.equals(actUser.userId)){
                            if(self.created_by.equals(actUser._id)) {
                                participants[actUser._id] = {
                                    attributes: actUser.attributeValues,
                                    name: user.username,
                                    creator: true
                                };
                            }else{
                                participants[actUser._id] = {
                                    attributes: actUser.attributeValues,
                                    name: user.username,
                                    creator: false
                                };
                            }
                        }
                    });
                });
                _callback(false, participants);
            });
        });
    };

    //Export model
    module.exports = mongoose.model('Activity', ActivitySchema);