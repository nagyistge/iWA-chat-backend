'use strict';

/**
 * The action retrieve the chat's messages of the specified chat collection. The request
 * may specify a message id or date, to request a number of newer or older messages from it, by
 * default get last messages sorted from the last to the older ones.
 *
 *
 * If it doesn't happen any error, the action sends a response with an data object with the
 * messages collection requested and sorted depending of the request; it has the next attributes:
 *  {
 *    chat: The id of the chat collection
 *    messages: Array with the message' object, which each one has the next fields:
 *      # _id: The id of the message
 *      # created_at:
 *      # text: The text of the message
 *      # [sender]: The user id that sent the message if it is different from the user in session
 *          than sent the request
 *  }
 *
 * Pre-conditions:
 *    # user has been authenticated
 *    # req.processed.chatMessage: This object must have the next fields:
 *      {
 *        chat: The chat object which has the next attributes:
 *            # id: The chat message id
 *            # msgColNum: The chat message collection number (3 digit characters).
 *         query: This object must have the next parameters:
 *            # numMsgs: The number of maximum messages to retrieve
 *            # sort:  1 (ascending: from older to newer) or -1 (descending: from newer to older)
 *         [message] : The message object may exist or not and if exist then the action check, if
 *          the 'id' attribute exist and ignore the rest, if it doesn't exist then check if the
 *          'created_at' exists.
 *      }
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');
var iWAChatMessage = require(settings.modelsPath + '/iwazat/chatMessage');


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }


  var userId = iWASession.getAuthUser(req.session).id;
  var chatRef = req.processed.chatMessage.chat;
  var reqQuery = req.processed.chatMessage.query;
  var query = {};
  var ChatMsgModel = iWAMongo.model(iWAChatMessage,
    iWAChatMessage.mongooseModelOptions(
      iWAChat.resolveChatMessageCollectionName(chatRef.id, chatRef.msgColNum)));


  if (reqQuery.id) {
    query._id = query.id;
  }

  if (reqQuery.start_at) {
    query.created_at = {$gt: new Date(reqQuery.start_at)};
  }

  if (reqQuery.end_at) {
    query.created_at = {$lt: new Date(reqQuery.end_at)};
  }


  query = ChatMsgModel.find(query);

  query.setOptions({
    lean: true
  });

  query.select({
    _id: true,
    created_at: true,
    sender: true,
    text: true
  });

  query.sort({created_at: reqQuery.sort});
  query.limit(reqQuery.numMsgs);


  query.exec(function (err, messageDocs) {

    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: chat # Action: getMessages ' +
        '| Error when retrieving the chat\'s messages from the collection: ' +
        chatRef.msgColNum, 520, err), 520);
      sendResponse(req, res, post);
      return;
    }

    messageDocs.forEach(function (msg) {
      msg.sender = msg.sender.toString();

      if (msg.sender === userId) {
        delete msg.sender;
      }
    });

    sendResponse(req, res, post, {
      chat: chatRef.id,
      messages: messageDocs
    });


  });
};

function sendResponse(req, res, post, chatMsg) {

  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, chatMsg);
  post(null, req, res);
}
