var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');

var csurf = require('csurf');

var index = require('./routes/index');
var user = require('./routes/user');
var activity = require('./routes/activity');
var search = require('./routes/search');
var wsRoutes = require('./routes/ws');
var testRoutes = require('./routes/test');
var docRoutes = require('./routes/documentation');

let uniqid = require('uniqid');

const app = express();

//websocket stuff
let http = require('http');
let server = http.createServer(app);

//db config
var mongoose = require('mongoose');
var mongoDB = 'mongodb://dev_user:moreofus217@ds113738.mlab.com:13738/moreofusdb';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// csrf handling

const csrfMiddleware = csurf({
    cookie: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfMiddleware);
app.use(express.static(path.join(__dirname, 'public')));


function genUuid(callback) {
    if (typeof(callback) !== 'function') {
        return uuidFromBytes(crypto.randomBytes(16));
    }

    crypto.randomBytes(16, function(err, rnd) {
        if (err) return callback(err);
        callback(null, uuidFromBytes(rnd));
    });
}

app.use(session({
    secret: 'a/sd$sf1Ed5£s24ds4f*56ds412Z31g',
    genid : function(){return uniqid()},
    name: 'c00k1emonst3r',
    resave: true,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
    var token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token);
    res.locals.csrfToken = token;
    next();
});

var comparatorCalc = require('./models/attribute/calculator');

comparatorCalc.refreshComparator();

app.use('/', index);
app.use('/user', user);
app.use('/activity', activity);
app.use('/search', search);
app.use('/ws', wsRoutes);
app.use('/test', testRoutes);
app.use('/documentation', docRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
