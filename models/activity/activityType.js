var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ActivityTypeSchema = new Schema(
    {
        name: {type: String, required: true, max: 100},
        background_color: {type: String, required: true},
        attribute_names: [{type: String}]
    }
    , { collection: 'activity_types' });

    ActivityTypeSchema.statics.getById = function(id, _callback){
        self = this;
        self.findOne({_id : id}).exec(function(err, actTypeObj){
            if(err){
                return _callback(err, actTypeObj);
            }
            _callback(false, actTypeObj);
        });
    }

//Export model
module.exports = mongoose.model('ActivityType', ActivityTypeSchema);