'use strict';

/**
 * The action retrieve the chats collections' reference and track them in the user's session
 * associated to the last collection number (the message_collection_count) (#23)
 * (#24): Possibility to perform different query filters and order
 *
 *
 * If it doesn't happen any error, the action sends a response with an object that has the
 * following attributes:
 *  {
 *    total_unread: A total unread messages that there are in the chats array (chats attribute)
 *    chats: Array of chat objects, each object has the following attributes:
 *        {
 *          _id: The id of the chat collection
 *          last_message_at: The date of the last message received in this chat
 *          receivers: Array with the users' id involved in the chat, without the the user that did the
 *                  request (The user hold in the session)
 *          [unread]: This is an object that only exists if there is any unread message for the
   *              user that sent the request (session user). It has the following attributes:
   *                {
   *                  last: The created_at of the last unread message (it is usually equal the
   *                      value of the last_message_at chat's field)
   *                  counter: The number of unread messages in this chat
   *                }
 *        }
 *  }
 *
 * Pre-conditions:
 *    # user has been authenticated
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
var ObjectId = require('mongoose').Types.ObjectId;
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');

/**
 * Globals
 */
var UserModel;
var ChatModel;
var chatDefaults;


// Initialization of non-straight away variables
(function initialize() {
  UserModel = iWAMongo.model(iWAUser);
  ChatModel = iWAMongo.model(iWAChat);
  chatDefaults = settings.entities.user.chat;
}());


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }


  var userId = iWASession.getAuthUser(req.session).id;
  var userObjId = ObjectId.fromString(userId);

  var query = ChatModel.find({
    members: userObjId
  });

  query.setOptions({
    lean: true
  });

  query.select({
    _id: true,
    members: true,
    message_collection_count: true,
    last_message_at: true
  });

  query.sort({last_message_at: -1});
  query.limit(chatDefaults.num_max_chats_allowed);

  query.exec(function (err, chats) {

    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: chat # Action: getUserChats ' +
        '| Error when retrieving the user\'s chat. User id: ' + userId, 520, err), 520);
      sendResponse(req, res, post);
      return;
    }


    UserModel.findById(userObjId,
      {
        unread_chats: true
      },
      {
        lean: true
      },
      function (err, unreadChats) {

        if (err) {
          helperGlobal.addError(req, new iWAErrors.Db('Controller: chat # Action: getUserChats ' +
            '| Error when retrieving the user\'s unread chat messages. User id: ' + userId, 520,
            err), 520);
          sendResponse(req, res, post);
          return;
        }

        var chatId;
        var uChatsObj = {
          total_unread: 0
        };
        unreadChats = unreadChats.unread_chats;

        chats.forEach(function (chat) {
          chatId = chat._id.toString();
          iWASession.registerChat(req.session, chatId, chat.message_collection_count);
          delete chat.message_collection_count;

          for (var m = 0; m < chat.members.length; m++) {
            if (chat.members[m].toString() === userId) {
              chat.members.splice(m, 1);
              break;
            }
          }

          chat.receivers = chat.members;
          delete chat.members;

          if ((unreadChats) && (unreadChats[chatId])) {
            chat.unread = {
              last: unreadChats[chatId].last_message_at,
              counter: unreadChats[chatId].counter
            };
            uChatsObj.total_unread += unreadChats[chatId].counter;
          }
        });

        uChatsObj.chats= chats;
        sendResponse(req, res, post, uChatsObj);
      });
  });

};

function sendResponse(req, res, post, uChatsObj) {

  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, uChatsObj);
  post(null, req, res);
}
