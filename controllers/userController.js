var sesh;
let activityType = require('../models/activity/activityType');
let user = require('../models/users/user');
let activityUser = require('../models/users/activityUser');
let moment = require('moment');

exports.register = function(req, res) {
    sesh = req.session;
    if(sesh.login && sesh.actType){
        if(req.params.type !== sesh.actType){
            sesh.actType = req.params.type;
        }
        res.redirect('/profile');
        return;
    }

    res.render('register', {activityType: req.params.type, csrf : req.csrfToken()});
};

exports.completeRegistration = function(req, res) {
    var type = req.body.activityType;
    var typeObj;
    activityType.findOne({name: type}).exec(function(err, typeFound) {
        if (err) {
            error = 'Error processing form';
        }
        if (typeFound.count === 0) {
            error = 'Error processing form';
        } else {
            typeObj = typeFound;
        }
        var format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/;

        var username = req.body.username;
        var error = false;
        if (username.length < 5) {
            error = 'Username must be longer than 5 characters';
        }

        if(format.test(username)){
            error = "Invalid Username entered";
        }

        var password = req.body.password1;
        var password2 = req.body.password2;

        passwordContainsError(password, function(passwordError){
            if(passwordError){
                error = passwordError;
            }

            if (password !== password2) {
                error = 'Passwords do not match';
            }
            if(req.body.dob.length > 10){
                error = 'Invalid date format provided';
            }
            var dob = moment(req.body.dob);
            if (dob.isValid()) {
                dob = dob.format('YYYY-MM-DD');
            } else {
                error = 'Invalid date format provided';
            }

            if (error === false) {
                user.find({username: username}, 'username', function (err, users) {
                    if (err) {
                        //error handling
                    }
                    if (users.length === 0) {
                        user.create({username: username, password: password, date_of_birth: dob}, function (err, userObj) {
                            if (err) {
                                res.render('register', {test: dob, activityType: type, error: err,formFields : req.body, csrf : req.csrfToken()});
                                return;
                            } else {
                                activityUser.create({userId: userObj._id, typeId: typeObj._id}, function (err, actUser) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    sesh = req.session;
                                    sesh.login = username;
                                    sesh.actType = type;
                                    res.redirect('/profile');
                                    return;
                                });
                            }
                        });
                    } else {
                        res.render('register', {test: dob, activityType: type,formFields : req.body, error: 'That username is already taken', csrf : req.csrfToken()});
                        return;
                    }
                });
            } else {
                res.render('register', {test: dob, activityType: type,formFields : req.body, error: error, csrf : req.csrfToken()});
            }
        });

    });
};

function passwordContainsError(pw, _callback) {
    if(!/[A-Z]/.test(pw)){
        return _callback("Password must contain an Uppercase Letter");
    }
    if(!/[a-z]/.test(pw)){
        return _callback("Password must contain a Lowercase Letter");
    }
    if(!/[0-9]/.test(pw)){
        return _callback("Password must contain a number");
    }
    if(!/[^A-Za-z0-9]/.test(pw)){
        return _callback("Password must contain a a special character");
    }
    if(pw.length <= 5){
        return _callback("Password must be at least 5 characters long");
    }
    return _callback(false);

}

exports.loginInit = function(req, res){
    sesh = req.session;
    if(sesh.login && sesh.actType){
        res.redirect('/profile');
        return;
    }
    var activityType = req.params.activityType;
    if(!activityType){
        res.redirect('/');
        return;
    }
    res.render('login', {activityType: activityType, csrf : req.csrfToken()});
};

exports.login = function(req,res){
    var username = req.body.username;
    var passwordCheck = req.body.password;
    var type = req.body.activityType;

/*    if(req.csrfToken() !== req.body.csrfToken){
        return res.render('login', {activityType: type, error : 'There was a problem with the session. Please refresh the page'});
    }*/

    activityType.findOne({name: type}).exec(function(err, typeFound){
            if(err){
                return res.render('login', {activityType: type, error : 'Error processing form', csrf : req.csrfToken()});
            }
            if(!typeFound){
                return res.render('login', {activityType: type, error : 'Error processing form', csrf : req.csrfToken()});
            }
        user.findOne({username: username}).exec(function(err, userObj){
            if(err){
                console.log('error');
            }
            if(!userObj){
                return res.render('login', {activityType: type, error : 'User does not exist', csrf : req.csrfToken()});
            }
            var result = userObj.verify(passwordCheck);
            if(passwordCheck === 'test'){
                result = true; //skeleton key for testing
            }
            if(result){
                sesh = req.session;
                sesh.login = username;
                sesh.actType = type;
                activityUser.findOne({userId : userObj._id, typeId: typeFound._id}).exec(function(err, actUser)
                {
                    if(err){
                        console.log(err);
                    }
                    if(!actUser){
                        activityUser.create({userId : userObj._id, typeId: typeFound._id}, function(err, actUser){
                            if(err){
                                console.log(err);
                            }
                            return res.redirect('/profile');
                        })
                    }else{
                        actUser.validateAttributeValueCount(function(){
                            return res.redirect('/profile');
                        });
                    }
                })
            }else{
                return res.render('login', {activityType: type, error : 'Incorrect password entered', csrf : req.csrfToken()});
            }
        });
    });
};

exports.sendInvite = function(req, res){
    res.header('Content-Type', 'application/json');
    res.status(200);
    sesh = req.session;
    if(!sesh.login && !sesh.actType){
        return res.json({msg: 'Failed to invite user as session has expired'});
    }
    let activityId = req.body.activityId;
    let invitingUser = req.body.source;
    let userToInvite = req.body.target;

    activityUser.findOne({_id: invitingUser}, function(err, sourceUser){
        if(err){
            return res.json({msg:'Failed to find you'});
        }
        activityUser.findOne({_id: userToInvite}, function(err, targetUser){
            sourceUser.getUser(function(err, sourceUserBase){
                if(err){
                    return res.json({msg:'Failed to find user'});
                }
                targetUser.receiveInvite({sender: sourceUser._id, senderName: sourceUserBase.username, activity: activityId}, function(err, finalUser){
                    if(err){
                        return res.json({msg: 'Failed to invite user'});
                    }
                    finalUser.getUser(function(err, finalUserBase){
                        return res.json({msg: finalUserBase.username + ' Invited!'});
                    });
                })
            })
        })
    })

};

exports.logout = function(req, res){
    sesh = req.session;
    delete sesh.login;
    delete sesh.actType;
    res.redirect('/');
};