let requiredParam = require('../error');

 exports.createInvite = function({sender = requiredParam('Sender'),
                                  senderName = requiredParam('SenderName'),
                                  activity = requiredParam('Activity')
                                  } = {}, _callback) {
     this.type = 'INVITE';
     this.content = senderName + ' has invited you to an activity!';
     this.sender = sender;
     this.activity = activity;

     if (typeof _callback === 'function'){
        return _callback({level: this.type, content: this.content, source: this.sender, activity: this.activity});
     }

     return {level: this.type, content: this.content, source: this.sender, activity: this.activity};

 };

 exports.createChat = function(){
        return false;
 };
