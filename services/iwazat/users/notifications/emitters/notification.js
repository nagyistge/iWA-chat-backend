'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Globals
 */
var notificationsSocket;
var notificationsLogger;


//Initialize the non-straight away global variables and receive the twitter consumer instance
(function initialize() {
  notificationsLogger =
    require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('usersNotifications');
  notificationsSocket = require(settings.servicesPath + '/iwazat/socket.io').socketIO;
  notificationsSocket = notificationsSocket.of('/users/notifications');

}());

/**
 * Returns a function that emit the message 'new message' to all the clients' sockets connected
 * sending a comment object passed like the first and only parameter to the returned function
 *
 * @param {Array | String} usersId The array of user ids or an only user id to send the notification
 * @param {Object} notification The notification object to send

 */
module.exports = function (usersId, notification) {

  if (Array.isArray(usersId)) {
   usersId.forEach(function(userId) {
     notificationsSocket.in(userId).emit('new notification', notification);
   });
  } else {
    notificationsSocket.in(usersId).emit('new notification', notification);
  }
};