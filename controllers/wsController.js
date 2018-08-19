let sesh;
let portFinder = require('portfinder');
let activityUser = require('../models/users/activityUser');

let express = require('express');
let app = express();


//websocket stuff
let http = require('http');

let running = false;

exports.getPort = function(req, res) {
    sesh = req.session;
    if(sesh.login !== undefined && sesh.actType !== undefined){
        portFinder.getPort(function(err, port){
            if(err){
                return res.json({result: false, message: 'Port not found'});
            }else {
                notificationServer(sesh, port, function(correctPort){
                    return res.json({result: true, message: 'Port found', port: correctPort, login: sesh.login})
                });
            }
        })
    }else {
        return res.json({result: false, message: 'User is not logged in'});
    }
};


exports.fallback = function(req, res){
    sesh = req.session;
    if(!sesh.login && !sesh.actType){
        return res.json({msg: 'Not logged in'});
    }
    activityUser.findFromUser(sesh.login, sesh.actType, function (err, actUser, user) {

        actUser.getNotificationsDue(function (empty, notifications, type) {
            if (empty) {
                return res.json({result: false, notifications: [], type: type, login: sesh.login});
            }
            if (notifications.length > 14) {
                return res.json({result: true, notifications: notifications.slice(0, 15), type: type, login: sesh.login});
            }
            return res.json({result: true, notifications: notifications, type: type, login: sesh.login});
        })
    })
};

let notificationServer = function(sesh, port, _callback){
    let WebSocketServer = require("ws").Server;
    let server = http.createServer(app);
    let check = function(_callback) {
        activityUser.findFromUser(sesh.login, sesh.actType, function (err, actUser, user) {
            if (err) {
                return _callback(JSON.stringify({result: false, error: 'There\'s a problem'}));
            }

            actUser.getNotificationsDue(function (empty, notifications, type) {
                if (empty) {
                    return _callback(JSON.stringify({result: true, notifications: [], type: type, login: sesh.login}));
                }
                if (notifications.length > 14) {
                    return _callback(JSON.stringify({result: true, notifications: notifications.slice(0, 15), type: type, login: sesh.login}));
                }
                return _callback(JSON.stringify({result: true, notifications: notifications, type: type, login: sesh.login}));
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
            ws.terminate();
        });
        let checkHandler;
        (checkHandler = function(){
            running = true;
            check(function (jsonString) {
                if(ws.readyState === ws.OPEN) {
                    ws.send(jsonString, function (err) {
                        if(err){
                            console.log(err);
                        }
                        running = false;
                    });
                }else{
                    console.log('WebSocket is closed: Port' + port);
                }
            })
        })();
        setInterval(function() {
            checkHandler();
        }, 5000);
    })        .on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            port++;
            console.log('Address in use, retrying on port ' + port);
            setTimeout(function () {
                server.listen(port);
            }, 250);
        }
    });


    server.listen(port, () => {
        console.log('Server started on port '+ port +' :)');
    })
        .on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                port++;
                console.log('Address in use, retrying on port ' + port);
                setTimeout(function () {
                    server.listen(port);
                }, 250);
            }
        });
    _callback(port);
};


exports.getNotifications = function(req, res){
    let sesh = req.session;
    if(sesh.login === undefined || sesh.actType === undefined){
        return res.json(JSON.stringify({result: false, notifications: []}));
    }
    findNotifications(sesh, function(json){
        return res.json(json);
    })
}

let findNotifications = function(sesh, _callback) {
    activityUser.findFromUser(sesh.login, sesh.actType, function (err, actUser, user) {
        if (err) {
            return _callback(JSON.stringify({result: false, error: 'There\'s a problem'}));
        }

        actUser.getNotificationsDue(function (empty, notifications, type) {
            if (empty) {
                return _callback(JSON.stringify({result: true, notifications: [], type: type, login: sesh.login}));
            }
            if (notifications.length > 14) {
                return _callback(JSON.stringify({result: true, notifications: notifications.slice(0, 15), type: type, login: sesh.login}));
            }
            return _callback(JSON.stringify({result: true, notifications: notifications, type: type, login: sesh.login}));
        })
    })
};