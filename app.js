var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var index = require('./routes/index');
var login = require('./routes/login');
var logout = require('./routes/logout');
var attend = require('./routes/attend');
var checkAttend = require('./routes/checkAttend');
var checkAttend2 = require('./routes/checkAttend2');
var classAttend = require('./routes/classAttend');
var schedule = require('./routes/schedule');
var register = require('./routes/user/register');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/favicon', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  key: 'sid',
  secret: 'I`m Here!',
  cookie: {
    maxAge: 1000 * 60 * 60 // 1시간동안 쿠키 유효
  },
  resave: false,
  saveUninitialized: true
}));

app.use('/login', login);
app.use('/logout', logout);
app.use('/attend', attend);
app.use('/checkAttend', checkAttend);
app.use('/checkAttend2', checkAttend2);
app.use('/classAttend', classAttend);
app.use('/schedule', schedule);
app.use('/register', register);
app.use('/', index);

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
