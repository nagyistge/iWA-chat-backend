'use strict';

/**
 *
 * Pre-conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.processed.chatMessage.chat: This object must have the next fields:
 *      {
 *        id: The chat id
 *        last_message_at: (Date object) The created_at date of the last message inserted into the
 *            messages' collection
 *        receivers: The receivers of this chat (Array of ObjectIds or stringify ObjectIds)
 *      }
 */

module.exports = exports;
var settings = require('../../../../settings.js');

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

// Initialization of non-straight away variables
(function initialize() {
  UserModel = iWAMongo.model(iWAUser);
  ChatModel = iWAMongo.model(iWAChat);
}());

module.exports = function (err, req, res, post) {

  if (err) {
    post(err, req, res);
    return;
  }

  var uSenderId = iWASession.getAuthUser(req.session).id;
  var chat = req.processed.chatMessage.chat;

  if ('string' === typeof chat.receivers[0]) {
    chat.receivers.forEach(function (receiver, idx) {
      chat.receivers[idx] = ObjectId.fromString(receiver);
    });
  }

  chat.receivers.push(ObjectId.fromString(uSenderId));


  ChatModel.update({
      _id: ObjectId.fromString(chat.id),
      members: {$all: chat.receivers}
    },
    {
      $set: {last_message_at: chat.last_message_at}
    },
    function (err, numAffected) {

      if (err) {
        post(new iWAErrors.Db('Controller: chat # Post-Middleware: updatesPostNewMessage | Error ' +
          'when updating the chat last_message_at after new message was created. Chat id: ' +
          chat.id, 521, err), req, res);
      } else {

        if (numAffected !== 1) {

          post(new iWAErrors.Db('Controller: chat # Post-Middleware: updatesPostNewMessage | ' +
            'Post-condition fails: The chat last_message_at update return ' + numAffected +
            ' documents updated, it must be 1 document. Chat id: ' + chat.id, 521, err), req, res);

        } else {

          // Remove the user who sent the message, it was added to it to check if the chat's members
          // pre-condition of matching them with the chat id
          chat.receivers.pop();
          var counter = chat.receivers.length;
          var errors = [];

          chat.receivers.forEach(function (receiver) {
            var chatMsgPath = 'unread_chats.' + chat.id;

             var update = {
              $set: {},
              $inc: {}
            };

            update.$set[chatMsgPath + '.last_message_at'] = chat.last_message_at;
            update.$inc[chatMsgPath + '.counter'] = 1;

            UserModel.findOneAndUpdate( {
              _id: receiver
            }, update, function (err, user) {
              counter--;

              if (err) {
                errors.push(new iWAErrors.Db('Controller: chat # Post-Middleware: ' +
                  'updatesPostNewMessage | Error when updating the user\'s chat unread messages. ' +
                  'Chat id: ' + chat.id + ' / User id: ' + receiver.toString(), 521, err));
              }
//              else if (!user) {
//                errors.push(new iWAErrors.Db('Controller: chat # Post-Middleware: ' +
//                  'updatesPostNewMessage | Post-condition fails any user document match with an ' +
//                  'user id stored like member of the chat id: ' + chat.id + ' / User id: ' +
//                  receiver.toString(), 521, err));
//              }

              if (counter === 0) {
                if (errors.length === 0) {
                  post(null, req, res);
                } else {
                  post(errors, req, res);
                }
              }
            }); // end user update
          }); // End users update loop
        }
      }
    }); // End update chat
};