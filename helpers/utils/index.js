var _ = require('lodash');

module.exports.sendToSelf = function (socket, method, data) {
  socket.emit(method, data);
};

module.exports._sendToSelf = function (io, socketId, method, data) {
  _.each(io.sockets.sockets, function (socket) {
    if (socket.id === socketId) {
      socket.emit(method, data);
    }
  });
};

module.exports.sendToAllConnectedClients = function (io, method, data) {
  io.sockets.emit(method, data);
};

module.exports.sendToAllClientsInRoom = function (io, room, method, data) {
  io.sockets.in(room).emit(method, data);
};

module.exports.sendToUser = function (
  socketList,
  userList,
  username,
  method,
  data
) {
  var userOnline = null;
  _.forEach(userList, function (v, k) {
    if (k.toLowerCase() === username.toLowerCase()) {
      userOnline = v;
      return true;
    }
  });

  if (_.isNull(userOnline)) return true;

  _.forEach(userOnline.sockets, function (socket) {
    var o = _.findKey(socketList, { id: socket });
    var i = socketList[o];
    if (_.isUndefined(i)) return true;
    i.emit(method, data);
  });
};

module.exports.sendToAllExcept = function (io, exceptSocketId, method, data) {
  _.each(io.sockets.sockets, function (socket) {
    if (socket.id !== exceptSocketId) {
      socket.emit(method, data);
    }
  });
};

module.exports.disconnectAllClients = function (io) {
  Object.keys(io.sockets.sockets).forEach(function (sock) {
    io.sockets.sockets[sock].disconnect(true);
  });
};
