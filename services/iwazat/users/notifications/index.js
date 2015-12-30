'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Depencies
 */
var util = require('util');


/**
 * It opens the socket namespace and attach authorization and connect client to users notifications
 * socket namespace
 *
 */

module.exports.initialise = function () {

  // Avoid that initialise can be run again in a future event loop cycle meanwhile although this
  // method initialization is synchronous we execute in the beginning by convention
  delete this.initialise;

  var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');
  var secIssuesLogger = iwaLogger.getWinstonLogger('securityIssues');
//var notificationsLogger = iwaLogger.getWinstonLogger('usersNotifications');
  var iWASession = require(settings.servicesPath + '/iwazat/session');
  var notificationsSocket = require(settings.servicesPath + '/iwazat/socket.io').socketIO;
  notificationsSocket = notificationsSocket.of('/users/notifications');


// Client connection authorization
  notificationsSocket.authorization(function (session, handshake, fn) {

    if (iWASession.isUserAuthenticated(session) === true) {
      fn(null, true);
    } else {
      secIssuesLogger.warn('Service: users/notifications # Action: socket#authorization | User ' +
        'has not be logged in | Client socket connection rejected, although somebody is trying to ' +
        'get access to the notifications socket. POSSIBLE ATTACK!!');
      fn(null, false);
    }
  }); // Socket authorization callback

  //notificationsSocket.on('connection', function (session, socket) {
  notificationsSocket.sessOn('connection', function (session, socket) {

    var authUser = iWASession.getAuthUser(session);

    if (!authUser) {
      settings.logger.error('Service: users/notifications # Action: socket#connection | Weird ' +
        'case: The connection has been authenticated but the user\'s session doesn\'t contains ' +
        'an authorized user, maybe the user logged out but the socket tried to reconnect after ' +
        'it. User\'s session object: ' + util.inspect(session));
      socket.disconnect();
    } else {
      socket.join(authUser.id);
    }

  });


  this.notify = require('./emitters/notification');
  this.notifyChatMessage = require('./emitters/chatMessage');
};


