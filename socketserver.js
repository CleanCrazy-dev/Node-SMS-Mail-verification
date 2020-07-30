var winston = require('winston');
var async = require('async');
var passportSocketIo = require('passport.socketio');
var cookieparser = require('cookie-parser');
var nconf = require('nconf');
var socketIOKey = nconf.get('socketIO_Key') || 8120;

// Submodules
//var ticketSocket = require('./socketio/ticketSocket')
//var chatSocket = require('./socketio/chatSocket');
var notificationSocket = require('./socketio/notificationSocket');
//var noticeSocket = require('./socketio/noticeSocket')
//var accountsImportSocket = require('./socketio/accountImportSocket')
//var backupRestoreSocket = require('./socketio/backupRestoreSocket')
//var logsSocket = require('./socketio/logsSocket')

var socketServer = function (ws) {
  'use strict';

  var socketConfig = {
    pingTimeout: nconf.get('socket:pingTimeout')
      ? nconf.get('socket:pingTimeout')
      : 15000,
    pingInterval: nconf.get('socket:pingInterval')
      ? nconf.get('socket:pingInterval')
      : 30000,
  };

  var io = require('socket.io')(ws.server, {
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
  });

  io.use(function (data, accept) {
    async.waterfall(
      [
        async.constant(data),
        function (data, next) {
          if (!data.request._query.token) {
            return next(null, data);
          }

          var userSchema = require('./models/user');
          userSchema.getUserByAccessToken(data.request._query.token, function (
            err,
            user
          ) {
            if (!err && user) {
              winston.debug(
                'Authenticated socket ' + data.id + ' - ' + user.email
              );
              data.request.user = user;
              data.request.user.logged_in = true;
              data.token = data.request._query.token;
              return next(null, data);
            }

            data.emit('unauthorized');
            data.disconnect('Unauthorized');
            return next(new Error('Unauthorized'));
          });
        },
        function (data, accept) {
          if (
            data.request &&
            data.request.user &&
            data.request.user.logged_in
          ) {
            data.user = data.request.user;
            return accept(null, true);
          }

          return passportSocketIo.authorize({
            cookieParser: cookieparser,
            key: 'connect.sid',
            store: ws.sessionStore,
            secret: socketIOKey,
            success: onAuthorizeSuccess,
          })(data, accept);
        },
      ],
      function (err) {
        if (err) {
          return accept(new Error(err));
        }

        return accept();
      }
    );
  });

  io.set('transports', ['polling', 'websocket']);

  io.sockets.on('connection', function (socket) {
    // Register Submodules
    //    ticketSocket.register(socket);
    //    chatSocket.register(socket);
    //    notificationSocket.register(socket);
    //    noticeSocket.register(socket);
    //    accountsImportSocket.register(socket);
    //    backupRestoreSocket.register(socket);
    //    logsSocket.register(socket);
  });

  global.io = io;

  // Register Event Loop
  global.socketServer = {
    eventLoop: {
      _loop: 0,
      start: function () {
        global.socketServer.eventLoop._loop = setInterval(function () {
          // The main socket event loop.
          notificationSocket.eventLoop();
          //          chatSocket.eventLoop();
        }, 5000);
      },
      stop: function () {
        clearInterval(global.socketServer.eventLoop._loop);
      },
    },
  };

  global.socketServer.eventLoop.start();

  winston.info('SocketServer Running');
};

function onAuthorizeSuccess(data, accept) {
  winston.debug('User successfully connected: ' + data.user.email);

  accept();
}

module.exports = socketServer;
