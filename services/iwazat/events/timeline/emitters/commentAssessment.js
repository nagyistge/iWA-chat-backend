'use strict';

module.exports = exports;
var settings = require('../../../../../settings');


/**
   * Returns a function that emit the message 'comment assessment' to all the clients' sockets
 * connected sending the user who assessed (add or remove) the message's comment
 *
 * @param {Object} serverSocket The server socket object
 * @returns {Function}
 */
module.exports = function (serverSocket) {

  return function (cmtAssessmentObj) {
    serverSocket.emit('comment assessment', cmtAssessmentObj);
  };
};