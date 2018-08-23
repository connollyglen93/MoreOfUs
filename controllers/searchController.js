let sesh;
let activityUser = require('../models/users/activityUser');
let activityType = require('../models/activity/activityType');
let activity = require('../models/activity/activity');
let calculator = require('../models/attribute/calculator');

let attributeConstants = require('../var/attributeConstants.json');

var numberOfUsersReturned = 12; //change this to change the number of users returned 

exports.begin = function(req, res) {
    sesh = req.session;
    var similarUsers = [];
    let attrSelection = decodeURIComponent(req.query.attrSelection);
    let origAttrSelection = attrSelection;
    console.log(attrSelection);
    console.log(typeof attrSelection);
    if(attrSelection !== "undefined"){
        attrSelection = JSON.parse(attrSelection);
    }
    let searchFunction;
    let additionalParam;
    activity.findOne({_id: req.params.activityId}, function(err, activityFound) {
        if(err){
            throw err;
        }
        activityUser.findFromUser(sesh.login, sesh.actType, function (err, currentUser) {
            //decide on search function used

            if(req.query.searchMethod !== "undefined"){
                switch(req.query.searchMethod){
                    case 'cosineSimilarity' : 
                        additionalParam = currentUser;
                        searchFunction = calculator.calcCosineSimilarity;
                        break;
                    default: 
                        searchFunction = calculator.sortVectors;
                        additionalParam = attrSelection;
                        break;
                }
            }else{
                searchFunction = calculator.sortVectors;
                additionalParam = attrSelection; 
            }

            activityUser.findAll(sesh.actType, function (err, users) {
                if (err) {
                    throw err;
                }
                var actUserIds = [];
                var userIds = [];
                let vectors = [];
                let alreadyParticipating;
                users.forEach(function (fullUser){
                    vectors[fullUser.actUser.userId + "|" + fullUser.actUser._id] = fullUser.actUser.attributeValues;
                });
                let userRange = numberOfUsersReturned/2;
             //   calculator.sortVectors(vectors, attrSelection, function(sortedVectors){
              //  calculator.calcCosineSimilarity(vectors, currentUser, function(sortedVectors){
                searchFunction(vectors, additionalParam, function(sortedVectors){
                    calculator.findNotParticipating(sortedVectors, currentUser, 
                        activityFound.participants, function(matchedUsers, index){
                        let lowerRange = Number(index) - Number(userRange);
                        let higherRange = Number(index) + Number(userRange);
                        let usersFound = [];
                        if(matchedUsers.length <= numberOfUsersReturned){
                            usersFound = matchedUsers;
                        }else{
                            usersFound = matchedUsers.slice(lowerRange, higherRange);
                            console.log("Higher Range");
                            console.log(higherRange);
                            console.log("Lower Range");
                            console.log(lowerRange);
                        }
                        console.log(usersFound);
                        
                        //console.log(users);
                        for(let userFoundKey in usersFound){
                            let ids = usersFound[userFoundKey].key.split("|");
                            let userIdFound = ids[0].trim();
                            let actUserIdFound = ids[1].trim();
                            users.forEach(function (fullUser) {
                                if(fullUser.actUser._id.equals(actUserIdFound)){
                                    console.log(fullUser);
                                    similarUsers.push({
                                        id: fullUser.actUser._id,
                                        userId: fullUser.actUser.userId,
                                        username: fullUser.user.username,
                                        attributeValues: fullUser.actUser.attributeValues
                                    });
                                }
                            });
                        }
                        currentUser.login = sesh.login;
                        console.log(currentUser);

                        activityType.findOne({name: sesh.actType}, function (err, activity) {
                            let attributeNames = [];                            
                            for(let i = 0; i < activity.attribute_names.length; i++){
                                if(origAttrSelection.includes(i)){
                                    attributeNames.push({name : activity.attribute_names[i], selected : true});
                                }else{
                                    attributeNames.push({name : activity.attribute_names[i], selected : false});
                                }
                            }
                            console.log(attributeNames);
                            res.render('search/index', {
                                activityType: sesh.actType,
                                activity: activityFound,
                                attributeNames: attributeNames,
                                currentUser: currentUser,
                                similarUsers: similarUsers,
                                csrf: req.csrfToken()});
                        });
                    })
                });
            });
        });
    });
};

exports.land = function(req, res){
    sesh = req.session;
    activity.findOne({_id: req.params.activityId}, function(err, activityFound) {
        if(err){
            throw err;
        }
        activityUser.findFromUser(sesh.login, sesh.actType, function (err, currentUser) {
            activityType.findOne({name: sesh.actType}, function (err, activity) {
                res.render('search/land', {
                    activityType: activity,
                    activity: activityFound,
                    currentUser: currentUser,
                }); 
            });
        });
    });
}