//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Entry point for our server.
  //  We establish HTTPS secure connections, hookup the database, and setup our routing
  //
  //  Notes:
  //
  //  Todo:
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ REQUIRES                                                                                          ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
  var express       = require('express');
  var path          = require('path');
  var favicon       = require('serve-favicon');
  var morgan        = require('morgan');
  var bodyParser    = require('body-parser');
  var mongoose      = require('mongoose');
  var passport      = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  //var Apex          = require('./models/jobs');
  var Users         = require('./models/user');
  // var Companies     = require('./models/companies');
  // var Jobs          = require('./models/jobs');
  var routes        = require('./routes/index');
  var authRouter    = require('./routes/authRouter');
  var userRouter    = require('./routes/userRouter');
  var companyRouter = require('./routes/companyRouter');
  var jobRouter     = require('./routes/jobRouter');
  var dataRouter    = require('./routes/dataRouter');
  var Utility       = require('./routes/utility');
  var config        = require('./config');
  var url           = config.mongoUrl;
  var app           = express();

  //Secure traffic only
  // app.all('*', function(req, res, next) {
  //   if(req.secure) { return next(); }
  //   res.redirect('https://'+req.hostname+':'+app.get('secPort')+req.url);
  // });

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ DATABASE                                                                                          ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
  mongoose.connect(url/*, {user:"admin", pass:"ep0z15"}*/);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'database connection error:'));
  db.once('open', function() {
    console.log("Successfully connected to our database.");
  });

  
//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ MISC MIDDLEWARE                                                                                   ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
  app.use(morgan('dev'));
  //Misc
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  //serve to the client our static public files and components
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ AUTHENTICATION                                                                                    ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
  app.use(passport.initialize());
  passport.use(new LocalStrategy(Users.authenticate()));
  passport.serializeUser(Users.serializeUser());
  passport.deserializeUser(Users.deserializeUser());


  app.use(function(err,req,res,next) {
    res.writeHead(err.status || 500, {
      'WWW-Authenticate': 'Basic',
      'Content-Type': 'text/plain'
    });
    res.end(err.message);
  });

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ ROUTING                                                                                           ╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
  //app.use('/', routes);
  app.use('/auth',      authRouter);
  app.use('/users',     userRouter);
  app.use('/companies', companyRouter);
  app.use('/jobs',      jobRouter);
  app.use('/data',      dataRouter);

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ ERROR HANDLERS                                                                                    ╣
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
      res.status(err.status || 500);
      res.json({
        message: err.message,
        error: err
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