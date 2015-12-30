'use strict';

module.exports = exports;
var settings = require('../../../../../settings');


/**
   * Returns a function that emit the message 'new message' to all the clients' sockets connected
 * sending a comment object passed like the first and only parameter to the returned function
 *
 * @param {Object} serverSocket The server socket object
 * @returns {Function}
 */
module.exports = function (serverSocket) {

  return function (messageObj) {
    serverSocket.emit('new message', messageObj);
  };
};