var mongoose = require('mongoose');

const bcrypt = require('bcrypt');

var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        username: {type: String, required: true, max: 100},
        password: {type: String, required: true, max: 100},
        date_of_birth: {type: Date, required: true}
    }

    , { collection: 'users' });

UserSchema.pre('save', function(next){
   self = this;

   self.password = bcrypt.hashSync(self.password, 10);

   next();
});

UserSchema.methods.verify = function(passwordCheck){

    if(bcrypt.compareSync(passwordCheck, this.password))
    {
        return true;
    }
    return false;
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