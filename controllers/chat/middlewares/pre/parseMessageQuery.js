'use strict';

/**
 *  The pre-middleware parses the body request attributes and populate the default parameters for
 *  those that have not been sent and are not required and dispose the query in
 *  req.processed.chatMessage.query, and the chat's object from the body request in
 *  req.processed.chatMessage.chat.
 *
 *  NOTE: This pre-middleware doesn't do any checking on req.body.chat object, only dispose it
 *  into req.processed.chatMessage.chat to a next pre-middleware or action process it
 *
 *  If all the query parameters have passed the checks then they are disposed in
 *  req.processed.chatMessage.query with the same names.
 *
 *  Other parameters contained in the request's body will be ignored, so they won't be populated
 *  in the req.processed.chatMessage object.
 *
 *  The expected query parameters (req.body.query) are:
 *  {
 *    [numMsgs]: The maximum number of chat's messages to retrieve
 *    [sort]: 1 (ascending: from older to newer) or -1 (descending: from newer to older). Note
 *      that this parameter require the start_at parameter.
 *    [start_at]: The newest created_at date to retrieve
 *    [end_at]: The oldest created_at date to retrieve
 *    [id]: the message id to retrieve
 *    chat: Object required by the most part of the chat message actions, but it is processed by
 *      next pre-middlewares or action
 *  }
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.body
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
// Utils
var check = require('validator').check;

/**
 * Globals
 */
var chatDefaults;

//Initialize the non straight away global variables
(function initialize() {
  chatDefaults = settings.entities.user.chat;
}());

module.exports = function (req, res, next) {

  var query;

  if (req.body.query) {
    query = req.body.query;

    try {
      check(query.numMsgs).isInt();

      if ((query.numMsgs > chatDefaults.num_max_messages_allowed) && (query.numMsgs < 1)) {
        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.ClientAttack('Controller: chat # Pre-middleware: parseChatMsgQuery ' +
            '| Specified to retrieve more than the maximum chat\'s message allowed', 603, req,
            query));
        helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message query');
        return;
      }
    } catch (e) {
      query.numMsgs = chatDefaults.num_max_messages;
    }

    try {
      check(query.sort).isInt();

      if ((query.sort !== 1) && (query.sort !== -1)) {
        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.ClientAttack('Controller: chat # Pre-middleware: parseChatMsgQuery ' +
            '| Specified an incorrect sort value', 603, req, query));
        helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message query');
        return;
      }
    } catch (e) {
      query.sort = chatDefaults.sort;
    }

  } else {
    query = {
      numMsgs: chatDefaults.num_max_messages,
      sort: chatDefaults.sort
    };
  }


  helperPreMiddlewares.addProcessedData(req, 'chatMessage', {
     chat: req.body.chat,
     query: query
  }, false);

  next();

};
