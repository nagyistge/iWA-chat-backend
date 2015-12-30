'use strict';

/**
 * The action register a not realtime chat message sent by the logged user to the users ids
 * received with the request.
 *
 * NOTE: The only checking that the action does is if the req.processed.chatMessage.message.text exists,
 * so if exist the field must be checked and filtered by some pre-middleware to avoid to
 * store text which contains some XSS vector attack
 *
 * If it doesn't happen any error, the action sends a response with an data object with the
 * with the new chat message created; it has the next attributes:
 *  {
 *    chat: The id of the chat collection
 *    _id: The id of the message
 *    created_at:
 *    text: The text of the message
 *  }
 *
 * Pre-conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.processed.chatMessage: This object must have the next fields:
 *      {
 *        chat: The chat object which has the next attributes:
 *            # id: The chat message id
 *            # msgColNum: The chat message collection number (3 digit characters)
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
var notifications = require(settings.servicesPath + '/iwazat/users/notifications')

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var ObjectId = require('mongoose').Types.ObjectId;
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');
var iWAChatMessage = require(settings.modelsPath + '/iwazat/chatMessage');

/**
 * Globals
 */
var UserModel;
var ChatModel;

// Initialization of non-straight away variables
(function initialize() {
  UserModel = iWAMongo.model(iWAUser);
  ChatModel = iWAMongo.model(iWAChat);
}());


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var uSenderId;
  var ChatMsgModel;
  var chatMsg = req.processed.chatMessage;


  if ((!chatMsg.message) || (!chatMsg.message.text)) {
    helperGlobal.addError(new iWAErrors.ClientAttack('Controller: chat # Action: newMessage | The chat message sent ' +
      'doesn\'t have text message', 603, req, chatMsg));
    sendResponse(req, res, post);
    return;
  }


  uSenderId = iWASession.getAuthUser(req.session).id;
  ChatMsgModel = iWAMongo.model(iWAChatMessage,
    iWAChatMessage.mongooseModelOptions(
      iWAChat.resolveChatMessageCollectionName(chatMsg.chat.id, chatMsg.chat.msgColNum)));


  ChatMsgModel.create({
      sender: uSenderId,
      text: chatMsg.message.text
    },
    function (err, chatMsgDoc) {
      if (err) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: chat # Action: newMessage ' +
          '| Error when creating the new chat message into the chat message\'s collection: ' +
          chatMsg.chat.msgColNum, 521, err), 521);
        sendResponse(req, res, post);
        return;
      }

      req.processed.chatMessage.chat.last_message_at = chatMsgDoc.created_at;

      notifications.notifyChatMessage(chatMsg.chat.id, chatMsg.chat.msgColNum, chatMsgDoc);

      sendResponse(req, res, post, {
        chat: chatMsg.chat.id,
        _id: chatMsgDoc.id,
        created_at: chatMsgDoc.created_at,
        text: chatMsgDoc.text
      });
    }); // End create new chat message
};



function sendResponse(req, res, post, chatMsg) {

  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, chatMsg);
  post(null, req, res);
}
