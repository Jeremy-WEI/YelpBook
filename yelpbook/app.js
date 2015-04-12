var express = require('express');
var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var Bing = require('node-bing-api')({accKey:"NI7NeDBXR06vWzeRY1eRXUYG+J42BnjVZe2TNCaxtlU"})
//var mongo = require('mongodb');

var expressSession = require('express-session');

var routes = require('./routes/index');
var business = require('./routes/business');
var users = require('./routes/users');
var homepage = require('./routes/homepage');


var FACEBOOK_APP_ID = "1423345787976364";
var FACEBOOK_APP_SECRET = "02b611212b606a730589d2dbf4ef5497";


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // To keep the example simple, the user's Facebook profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Facebook account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));

app.use(expressSession({secret:'5data5base0'}));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));



//var mongoose = require('mongoose'); //mongo driver
//var connection = require("./business");
var multer  = require('multer');
var done;
//file upload package configuration
app.use('/uploads', express.static(__dirname + "/uploads"));
app.use(multer({ dest: './uploads/',
    rename: function (fieldname, filename, req, res) {
        return fieldname + filename + Date.now();
    },
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function (file, req, res) {
        console.log(file.name + ' uploaded to  ' + file.path);
        req.file = file;
        done=true;
    }
}));


//// Set up MongoDB database connection
//var Db = mongo.Db;
//var Server = mongo.Server;
//var db = new Db('yelpbook_mongo',
//    new Server('localhost', '27017', {auto_reconnect: true}, {}),
//    {safe: true}
//);
//db.open(function(){});


app.use('/', routes);
app.use('/business', business);
//app.use('/follow', business);
app.use('/users', users);
app.use('/homepage', homepage);


app.get('/', function(req, res){
//    res.render('index', { user: req.user });
    res.render('index', { user: req.user});
});


app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
    res.render('login', { user: req.user });
});



// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
    passport.authenticate('facebook'),
    function(req, res){
        console.log("/auth/facebook callback");
        console.log(req.session.returnTo);
        // The request will be redirected to Facebook for authentication, so this
        // function will not be called.
    });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
//        console.log(("req.session: ") + JSON.stringify(req.session));
        res.redirect('/users/my_feed');
//        res.redirect('/');
    });

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.session.returnTo = req.path;
    console.log(("ensureAuthenticated req.session: ") + JSON.stringify(req.session));
    res.redirect('/login');
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





module.exports = app;
