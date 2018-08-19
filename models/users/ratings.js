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


    RatingSchema.statics.rateUser = function(actUserId, rating, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        console.log("b");
        var activityUser = require('../users/activityUser');
        activityUser.findOne({_id : actUserId}).exec(function(err, actUser){
            if(err){
                console.log(err);
                callback(err, false);
            }
            console.log("c");
            let ratingIndexes = actUser.attributeValues.length;
            ratingObj.mapUserAttributeRatings(ratingIndexes, actUserId, function(err, ratingObjs){
                if(err){
                    callback(err, false);
                }
                console.log("d");
                ratingObj.insertRating(ratingObjs, actUserId, rating, function(err, completedRatings){
                    if(err){
                        callback(err, completedRatings);
                    }
                    console.log("e");
                    actUser.updateAttributes(function(err, updatedUser){
                        callback(err, updatedUser);
                    })
                })
            })
        })
    };

    RatingSchema.statics.insertRating = function(ratingObjs, actUserId,rating, callback){
        var ratingObj = mongoose.model('Ratings', RatingSchema);
        let existing = ratingObjs.existent;
        let newRatings = ratingObjs.nonExistent;
        let count = Number(existing.length) + Number(newRatings.length);
        console.log("Count = " + count);
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
            console.log("Final ratings count = " + finalRatings.length);
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

    RatingSchema.statics.mapUserAttributeRatings = function(attributesLength, actUserId, callback){
            var ratingObj = mongoose.model('Ratings', RatingSchema);
            let done = [];
            let errors = [];
            let existingRatingObjs = {existent : [], nonExistent : []};
            for(let i = 0; i < attributesLength; i++){
                ratingObj.findOne({actUserId: actUserId, attrIndex : i}).exec(function(err, existingRatings){
                    if(err){
                        errors.push(err);
                    }else{
                        if(existingRatings && typeof existingRatings != undefined && typeof existingRatings != null ){
                            existingRatingObjs.existent.push(existingRatings);
                        }else{
                            existingRatingObjs.nonExistent.push(i);
                        }
                        done.push(i + " done");
                    }
                })
            }

            let waitForAsync;
            (waitForAsync = function(){
                if(done.length != attributesLength){
                    setTimeout(function(){
                        waitForAsync();
                    }, 1000)
                }else if(errors.length){
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
                        callback(err, updatedUser);
                    })
                })
            })
        })
    };


module.exports = mongoose.model('Ratings', RatingSchema);