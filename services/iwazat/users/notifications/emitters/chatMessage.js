'use strict';

/**
 *  NOTE: To enhance the performance and because this function should be called after a HTTP request
 *  has been processed by a pre-middlewares/Action chain or from some internal system's process,
 *  it doesn't use the ChatMessage mettattachment to create the new metattachment for the new
 *  notification
 */

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Depencies
 */
// Notification emitter
var notifEmitter = require('./notification');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');
var iWANotification = require(settings.modelsPath + '/iwazat/notification');
var iWAChatMsgMeta = require(settings.modelsPath + '/iwazat/_plugins/metattachments/iwazat/chatMessage');

/**
 * Globals
 */
var globalLogger;
var ChatModel;

//Initialize the non-straight away global variables and receive the twitter consumer instance
(function initialize() {
  globalLogger = settings.logger;
  ChatModel = iWAMongo.model(iWAChat);
}());

/**
 * Create a new chat message notification and emit it to the chat message's receivers users
 *
 * @param {String} chatId The chat's id owner the chat message
 * @param {String} msgColNum Message's collection number where the chat message is stored
 * @param {Object} chatMsgDoc The mongoose chat message's document
 */
module.exports = function (chatId, msgColNum, chatMsgDoc) {

  ChatModel.findById(chatId,
    {
      members: true
    },
    {
      lean: true
    },
    function (err, chat) {

      if (err) {
        globalLogger.error('Service: users/notifications # Action: emitter/chatMessage | Error ' +
          'to retrieve the chat document from the database | Details: ' + err);
        return;
      }

      if (!chat) {
        globalLogger.error('Service: users/notifications # Action: emitter/chatMessage | No chat ' +
          'found with the id: ' + chatId);
        return;
      }

      chat.members.forEach(function (userId) {
        var NotifModel;

        if (userId.equals(chatMsgDoc.sender)) {
          return;
        }


        NotifModel = iWAMongo.model(iWANotification,
          iWANotification.mongooseModelOptions(userId.toString()));


        NotifModel.create(
          {
            created_at: Date.now(),
            status: 'unread',
            content: {
              title: 'New message',
              text: 'You have a new private message'
            },
            entities: [
              {
                type: iWAChatMsgMeta.typeName,
                data: {
                  chat_id: chatId,
                  message_id: chatMsgDoc.id,
                  message_collection_num: msgColNum
                }
              }
            ]
          },
          function (err, notifDoc) {

            if (err) {
              globalLogger.error('Service: users/notifications # Action: emitter/chatMessage | ' +
                'Error to create the new chat message\'s notification into the database | Details: ' +
                err);
              return;
            }

            notifEmitter(userId.toString(), notifDoc);
          });
      }); // End loop of receivers
    });
};