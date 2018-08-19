let activityUser = require('../users/activityUser');

let WebSocketServer = require("ws").Server;

let running = false;

let notificationChecker = function(){

};

notificationChecker.prototype.run = function(server, sesh) {
   // let server = http.createServer(app);
    console.log(sesh);
    let check = function(_callback) {
        activityUser.findFromUser(sesh.login, sesh.actType, function (err, actUser, user) {
            if (err) {
                return _callback(JSON.stringify({result: false, error: 'There\'s a problem'}));
            }

            actUser.getNotificationsDue(function (empty, notifications, type) {
                if (empty) {
                    return _callback(JSON.stringify({result: true, notifications: [], type: type}));
                }
                if (notifications.length > 14) {
                    return _callback(JSON.stringify({result: true, notifications: notifications.slice(0, 15), type: type}));
                }
                return _callback(JSON.stringify({result: true, notifications: notifications, type: type}));
            })
        })
    };

    let wss = new WebSocketServer({server: server});
//    console.log(wss.address());
    wss.on('connection', function (ws) {
/*        ws.on('message', function (message) {
            ws.send('hi', function(err){
                if(err){
                    throw err;
                }
            });
        });*/
        ws.on('close', function(){
            console.log('The connection was closed');
            running=false;
        });
        let checkHandler;
        (checkHandler = function(){
            running = true;
            check(function (jsonString) {
                if(ws.readyState === ws.OPEN) {
                    ws.send(jsonString, function (err) {
                        running = false;
                    });
                }/*else{
                    console.log('WebSocket is closed:');
                }*/
            })
        })();
        setInterval(function() {
            checkHandler();
        }, 5000);
    });
    if(server.address() === null) {
        server.listen(40510, () => {
            console.log(`Server started on port 40510 :)`);
        });
    }
};

notificationChecker.prototype.isRunning = function(){
    return running;
};

module.exports = new notificationChecker();
