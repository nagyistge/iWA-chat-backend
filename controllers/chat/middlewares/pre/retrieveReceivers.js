'use strict';

/**
 *  The pre-middleware req.processed.chatMessage.chat.receivers exists, if it doesn't exist
 *  then retrieve the chat's members from the DB, remove the session's user from it, and
 *  attaches them to req.processed.chatMessage.chat.receivers (Array of ObjectId's, not strings).
 *
 *  NOTE: This pre-middleware doesn't check the receivers if it exists, so only call the next
 *  element of the route's chain.
 *
 *  Pre conditions:
 *    # user has been authenticated
 *    # req.processed.chatMessage.chat.id must exist
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');


/**
 * Globals
 */
var ChatModel;

//Initialize the non straight away global variables
(function initialize() {
  ChatModel = iWAMongo.model(iWAChat);
}());

module.exports = function (req, res, next) {

  if (helperPreMiddlewares.jumpIfErrors(req, res, next)) {
    return;
  }

  if (req.processed.chatMessage.chat.receivers) {
    next();
  } else {

    var userId = iWASession.getAuthUser(req.session).id;
    var reqChat = req.processed.chatMessage.chat

    ChatModel.findById(reqChat.id, {
      members: true
    }, function (err, chat) {

      if (err) {
        helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: chat # ' +
          'Pre-middleware: retrieveReceivers| Error when retrieving the chat\'s receivers. Chat ' +
          'id: ' + reqChat.id, 520, err));
        helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'chat\'s request');
      } else {
        chat.members.remove(userId);
        reqChat.receivers = chat.members;
      }
      next();
    });
  }


};
