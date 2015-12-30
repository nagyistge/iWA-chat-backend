'use strict';

/**
 *  The pre-middleware get the chat's id from the URL (express parameter chatId) and populate
 *  it with the query's parameters to get the last message in the specified chat.
 *
 *  NOTE: This pre-middleware doesn't do any checking on chatId parameter, so some of the next
 *  elements of the route chain must check it. Moreover it either do any checking if one error
 *  has been reported from a previous pre-middleware, so an existing error will remain in
 *  req.processed.errors to be checked for a following route's element.
 *
 *  The pre-middleware populate req.processed.chatMessage, expecting that doesn't exist, with an
 *  object with the next attributes:
 *    {
 *      chat: {
 *        _id: The chat's id got from the URL which will be used to get the message collection to
 *          the get the last message
 *      },
 *      query: {
 *        numMsgs: Always is 1
 *        sort: Always is -1
 *      }
 *    }
 *
 *    The 'query' attribute of req.processed.chatMessage has the appropriated values to get the last
 *    chat's message from an action that accepts some parameters to parametrize the query that
 *    launches over a collection of chat's messages.
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


/**
 * Globals
 */

//Initialize the non straight away global variables
(function initialize() {

}());

module.exports = function (req, res, next) {


  helperPreMiddlewares.addProcessedData(req, 'chatMessage', {
     chat: {
       _id: req.params.chatId
     },
     query: {
       numMsgs: 1,
       sort: -1
     }
  }, false);

  next();

};
