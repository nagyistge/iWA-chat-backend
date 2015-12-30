'use strict';

module.exports = exports;

/**
 * Emitters
 */
var newMessage = require('./newMessage');
var newComment = require('./newComment');
var msgAssessment = require('./messageAssessment');
var cmtAssessment = require('./commentAssessment');

/**
 * Returns an object that each attribute is a function that receive some parameters to emit a one
 * message type.
 *
 * @param {Object} serverSocket The server socket object
 * @returns {Object}
 */
module.exports = function (serverSocket) {
  return {
    newMessage: newMessage(serverSocket),
    newComment: newComment(serverSocket),
    messageAssessment: msgAssessment(serverSocket),
    commentAssessment: cmtAssessment(serverSocket)
  };
};