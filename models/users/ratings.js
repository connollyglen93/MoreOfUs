var mongoose = require('mongoose');
var activityType = require('../activity/activityType');
var moment = require('moment');

var Schema = mongoose.Schema;

var RatingSchema = new Schema(
    {
        actUserId: {type: Schema.Types.ObjectId, required: true, ref: 'ActivityUser'},
        attrIndex: {type: Number, required: true},
        values: [{type: Number}]
    }
    , { collection: 'ratings' });

    RatingSchema.index({ actUserId: 1, attrIndex: 1}, { unique: true });


    RatingSchema.statics.rateUser = function(actUserId, rating,ratingUserId, actId, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        var activityUser = require('../users/activityUser');
        var activitySchema = require('../activity/activity');
        var activityTypeSchema = require('../activity/activityType');
        activitySchema.findOne({_id : actId}).exec(function(err, activity){
            if(err){
                console.log(err);
                return callback(err, false);
            }
            activityTypeSchema.findOne({_id : activity.type}).exec(function(err, activityType){
                if(err){
                    console.log(err);
                    return callback(err, false);
                }
                activityUser.findOne({_id : actUserId}).exec(function(err, actUser){
                    if(err){
                        console.log(err);
                        return callback(err, false);
                    }
                    let ratingIndexes = [];
                    if(typeof activity.ratings !== 'undefined' && activity.ratings.length > 0){ //check for already rated attributes
                        console.log("I");
                        activity.ratings.forEach(function(rating){
                            if(typeof rating.participantId !== 'undefined' && rating.participantId.equals(ratingUserId)){
                                console.log("J");
                                rating.ratedUsers.forEach(function(ratedUser){
                                    if(ratedUser.id.equals(actUserId)){
                                        console.log("K");
                                        console.log(ratedUser);
                                        for(let i = 0; i < actUser.attributeValues.length; i++){
                                            if(ratedUser.attribIndexes.indexOf(i) === -1){ //if an attribute index is not in the activity ratings for the user being rated
                                                ratingIndexes.push(i);
                                            }
                                        }
                                    }
                                })
                            } 
                        })
                    }
                    console.log(ratingIndexes);
                    if(ratingIndexes.length === 0){ //if we can't define what attributes to rate, rate them all
                        for(let i = 0; i < activityType.attribute_names.length; i++){
                            ratingIndexes.push(i);
                        }
                    }
                    ratingObj.mapUserAttributeRatings(ratingIndexes, actUserId, function(err, ratingObjs){
                        if(err){
                            return callback(err, false);
                        }
                        console.log('A');
                        console.log({ratingIndexes: ratingIndexes});
                        ratingObj.insertRating(ratingObjs, actUserId, rating, function(err, completedRatings){
                            if(err){
                                return callback(err, completedRatings);
                            }
                            console.log('B');
                            actUser.updateAttributes(function(err, updatedUser){
                                console.log('C');
                                console.log(updatedUser);
                                console.log(err);
                                return callback(err, updatedUser);
                            })
                        })
                    })
                })
            })
        });
    };

    RatingSchema.statics.insertRating = function(ratingObjs, actUserId,rating, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        let existing = ratingObjs.existent;
        let newRatings = ratingObjs.nonExistent;
        let count = Number(existing.length) + Number(newRatings.length);
        console.log("Count = " + count);
        console.log({newRatings: newRatings , existing: existing});
        let finalRatings = [];
        let errors = [];
        if(existing.length){
            existing.forEach(function(existingAttributeRating){
                existingAttributeRating.values.push(rating);
                existingAttributeRating.save(function(err, updatedExistingAttributeRating){
                    if(err){
                        errors.push(err);
                    }else{
                        finalRatings.push(updatedExistingAttributeRating);
                    }
                })
            })
        }
        if(newRatings.length){
            newRatings.forEach(function(newAttributeRatingIndex){
                let ratingValue = [];
                ratingValue.push(rating);
                ratingObj.create({actUserId: actUserId, 
                    attrIndex : newAttributeRatingIndex, 
                    values : [rating]
                    }, function(err, newRatingObj){
                        if(err){
                            errors.push(err);
                        }else{
                            finalRatings.push(newRatingObj);
                        }
                    }
                )
            })
        }  
        let waitForAsync;
        (waitForAsync = function(){
            console.log({finalRatings: finalRatings, errors: errors});
            if(finalRatings.length !== count){
                setTimeout(function(){
                    waitForAsync();
                }, 1000)
            }else if(errors.length){
                callback(errors[0], finalRatings);
            }else{
                callback(false, finalRatings);
            }
        })();
    }

    RatingSchema.statics.mapUserAttributeRatings = function(attributes, actUserId, callback){
            var ratingObj = mongoose.model('Ratings', RatingSchema);
            let done = [];
            let errors = [];
            let existingRatingObjs = {existent : [], nonExistent : []};
            for(let i = 0; i < attributes.length; i++){
                let j = attributes[i];
                console.log("Ratings Search");
                console.log({actUserId: actUserId, attrIndex : j});
                ratingObj.findOne({actUserId: actUserId, attrIndex : j}).exec(function(err, existingRatings){
                    if(err){
                        errors.push(err);
                    }else{
                        if(existingRatings && typeof existingRatings != undefined && typeof existingRatings != null ){
                            existingRatingObjs.existent.push(existingRatings);
                        }else{
                            existingRatingObjs.nonExistent.push(j);
                        }
                        done.push(j + " done");
                    }
                })
            }

            let waitForAsync;
            (waitForAsync = function(){
                if(done.length != attributes.length){
                    console.log("Waiting in ratings class");
                    console.log({done: done, size: attributes, errors: errors});
                    setTimeout(function(){
                        waitForAsync();
                    }, 1000)
                }else if(errors.length > 0){
                    callback(errors[0], false);
                }else{
                    callback(false, existingRatingObjs);
                }
            })();

    }

    RatingSchema.statics.mapAttributeRating = function(attrIndex, actUserId, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        let existingRatingObjs = {existent : [], nonExistent : []};
        ratingObj.findOne({actUserId: actUserId, attrIndex : attrIndex}).exec(function(err, existingRatings){
            if(existingRatings && typeof existingRatings != undefined && typeof existingRatings != null ){
                callback(err, existingRatings);
            }else{
                callback(err, attrIndex);
            }
        })
        
    }


    RatingSchema.statics.rateAttribute = function(actUserId, attrIndex, rating, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        var activityUser = require('../users/activityUser');
        activityUser.findOne({_id : actUserId}).exec(function(err, actUser){
            if(err){
                callback(err, false);
            }
            ratingObj.mapAttributeRating(attrIndex, actUserId, function(err, ratingObjResult){
                if(err){
                    callback(err, false);
                }
                let ratingUpdateObj = {existent: [], nonExistent: []};
                if(ratingObjResult == attrIndex){
                    ratingUpdateObj.nonExistent.push(ratingObjResult);
                }else{
                    ratingUpdateObj.existent.push(ratingObjResult);
                }
                ratingObj.insertRating(ratingUpdateObj, actUserId, rating, function(err, updatedRating){
                    if(err){
                        callback(err, updatedRating);
                    }
                    actUser.updateAttributes(function(err, updatedUser){
                        if(err){
                            return callback(err, updatedUser);
                        }
                        updatedUser.save(function(err, newUser){
                            return callback(err, newUser);
                        })
                    })
                })
            })
        })
    };


module.exports = mongoose.model('Ratings', RatingSchema);