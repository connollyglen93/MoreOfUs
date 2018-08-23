var mongoose = require('mongoose');

var crypto = require('crypto');

var Schema = mongoose.Schema;

var password = new Schema({
    salt:  {type: String, required: true}, 
    hash:  {type: String, required: true}, 
    iterations:  {type: Number, required: true},
    _id: {id:false}
  });

var UserSchema = new Schema(
    {
        username: {type: String, required: true, max: 100},
        password: {type: password, required: true},
        date_of_birth: {type: Date, required: true}
    }

    , { collection: 'users' });


    function hashPassword(password, _callback) {
        var salt = crypto.randomBytes(128).toString('base64');
        var iterations = 10000;
        var hash = crypto.pbkdf2Sync(password, salt, iterations,32, 'sha1');
        return _callback({
            salt: salt,
            hash: hash,
            iterations: iterations
        });
    }

UserSchema.pre('save', function(next){
   self = this;
    var password = Buffer.from(self.password.hash);
    hashPassword(password, function(passwordObj){
       self.password = passwordObj;
        next();
   });
});

UserSchema.methods.verify = function(passwordCheck, _callback){
    console.log(this);
    if(typeof this.password === 'undefined' || typeof this.password.hash === 'undefined'){
        return _callback(false);
    }

    return _callback(this.password.hash == crypto.pbkdf2Sync(Buffer.from(passwordCheck), 
                                                            this.password.salt, 
                                                            this.password.iterations,32, 'sha1'
                                                        )
                        );
    
};

/*
// Virtual for author's full name
UserSchema
    .virtual('username')
    .get(function () {
        return this.username;
    });

// Virtual for author's URL
UserSchema
    .virtual('url')
    .get(function () {
        return '/user/profile/' + this._id;
    });
*/



//Export model
module.exports = mongoose.model('User', UserSchema);