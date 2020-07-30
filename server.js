var _ = require('lodash');
var nconf = require('nconf').argv().env();
var async = require('async');
var express = require('express');
var WebServer = express();
var winston = require('winston');
var middleware = require('./middleware');
var routes = require('./routes');
var server = require('http').createServer(WebServer);
var port = nconf.get('port') || 8120;

(function (app) {
  'use strict';

  // Load Events
  require('./emitter/events');

  module.exports.server = server;
  module.exports.app = app;
  module.exports.init = function (db, callback, p) {
    winston.debug('Init...');
    if (p !== undefined) port = p;
    async.parallel(
      [
        function (done) {
          middleware(app, db, function (middleware, store) {
            module.exports.sessionStore = store;
            routes(app, middleware);

            return done();
          });
        },
      ],
      function () {
        return callback();
      }
    );
  };

  module.exports.listen = function (callback, p) {
    if (!_.isUndefined(p)) port = p;

    server.on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        winston.error('Address in use, exiting...');
        server.close();
      } else {
        winston.error(err.message);
        throw err;
      }
    });

    server.listen(port, '0.0.0.0', function () {
      winston.info('Tridacom Hub is now listening on port: ' + port);

      if (_.isFunction(callback)) return callback();
    });
  };
})(WebServer);
