var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var colors = require('colors');
var timeout = require('connect-timeout');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// setup custom logger stuff
logger.token('time', (req) => { return new Date().toTimeString().green; })
logger.token('status', (req, res) => { return res.statusCode.toString().cyan })
logger.token('method', (req, res) => { return req.method.toString().red })
logger.token('url', (req, res) => { return req.url.toString().blue })

// taken from morgan source @b29fc88 https://github.com/expressjs/morgan/blob/master/index.js
logger.token('response-time', function getResponseTimeToken (req, res) {
  if (!req._startAt || !res._startAt) { /* missing request and/or response start time */ return }

  var ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6

  return ms.toFixed(2).toString().magenta
})

app.use(timeout('7s'))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger((tokens, req, res) => {
  return [
    tokens['time'](req, res),
    tokens['method'](req, res),
    tokens['url'](req, res),
    tokens['status'](req, res),
    tokens['response-time'](req, res), 'ms'.magenta, '-',
    tokens.res(req, res, 'content-length')
  ].join(' ')
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(haltOnTimedout)
app.use(cookieParser());
app.use(haltOnTimedout)
app.use(express.static(path.join(__dirname, 'public'), { 'maxAge': '2h' }));
app.use(haltOnTimedout)

var index = require('./routes/index');
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

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
  else console.log('timed out!'.red)
}

module.exports = app;
