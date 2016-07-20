//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                         REQUIRES                                                  ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var morgan        = require('morgan');
//var session       = require('express-session');
//var FileStore     = require('session-file-store')(session);
var bodyParser    = require('body-parser');
var mongoose      = require('mongoose');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var assert        = require('assert');
var Apex          = require('./models/jobs');
var User          = require('./models/user');
var companies     = require('./models/companies');
var config        = require('./config');
var routes        = require('./routes/index');
var jobRouter     = require('./routes/jobRouter');
var userRouter    = require('./routes/userRouter');
var dataRouter    = require('./routes/dataRouter');
var url           = config.mongoUrl;
var app           = express();

//Secure traffic only
app.all('*', function(req, res, next) {
  if(req.secure) { return next(); }
  res.redirect('https://'+req.hostname+':'+app.get('secPort')+req.url);
});


//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                           DATABASE                                                ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
mongoose.connect(url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Successfully connected to our database.");
  //db.collection('jobs').drop(function() { console.log("apex/jobs dropped.") });


  // //Method 1 for creating a new job
  // var newJob = Apex({
  //   name: "NameTest1",
  //   lot: "LotTest1",
  //   floorPlan: "FloorPlanTest1",
  //   jobNumber: "JobNumberTest1",
  //   company: "57683617d93372cbbe7db621",
  //   status: "Pending",
  //   download: "not available",
  //   submitBy: "5756fcff202649d0220574ef",
  //   comments: [ { author: "5751fa354d964d9c3f743e8f", body: "urBody1"}, { author: "5751fa354d964d9c3f743e8f", body: "urBody12"} ],
  //   specs:  { psi: 5}
  // });

  // newJob.save(function(err){
  //   if(err) throw(err);
  //   //console.log('New job created - heres the poop:');
  //   //newJob.dump();

  // //Method 2 for creating a new job
  // Apex.create({
  //   name: "NameTest2",
  //   lot: "LotTest2",
  //   floorPlan: "FloorPlanTest2",
  //   jobNumber: "JobNumberTest2",
  //   company: "57683656d93372cbbe7db622",
  //   status: "Pending",
  //   download: "not available",
  //   submitBy: "5756fcff202649d0220574ef"
  // }, function(err, job){
  //     if(err) throw err;
  //     //Grab everything in our DB and put it into the 'jobs' variable then print
  //     Apex.find({}, function(err, jobs) {
  //       if(err) throw err;
  //       //console.log("Finding what is in our db...");
  //       //console.log(jobs);
  //       //db.collection('jobs').drop(function() { console.log("apex/jobs dropped."); db.close(); });
  //   });
  //  });
  // });


});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                       MISC MIDDLEWARE                                             ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
app.use(morgan('dev'));
//View engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
//Misc
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));


//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                       AUTHENTICATION                                              ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
app.use(passport.initialize());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use(express.static(__dirname + '/public'));

app.use(function(err,req,res,next) {
  res.writeHead(err.status || 500, {
    'WWW-Authenticate': 'Basic',
    'Content-Type': 'text/plain'
  });
  res.end(err.message);
});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                          ROUTING                                                  ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//app.use('/', routes);
app.use('/jobs', jobRouter);
app.use('/users', userRouter);
app.use('/data', dataRouter);


//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠                                       ERROR HANDLERS                                              ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler, will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {




    console.log("WE GOT A PROBLEM HERE:");
    console.log("\nREQUEST URL: ", req.url);
    console.log("\nREQUEST METHOD: ", req.method);
    console.log("\nREQUEST BODY: ", req.body);
    console.log("\nERROR: ", err);
    console.log("\nERROR MESSAGE: ", err.message);
    console.log("\nERROR STATUS: ", err.status);

    //var fullError = JSON.stringify(err, ["message", "arguments", "type", "name", "status"]);

    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err/*,
      errordump: fullError*/

    });
  });
}

// production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

module.exports = app;
