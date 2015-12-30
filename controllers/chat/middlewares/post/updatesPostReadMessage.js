'use strict';

/**
 *
 * Pre-conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.processed.chatMessage.chat: This object must have the next fields:
 *      {
 *        id: The chat id (ObjectId or Stringify ObjectId)
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

/**
 * Globals
 */
var UserModel;

// Initialization of non-straight away variables
(function initialize() {
  UserModel = iWAMongo.model(iWAUser);
}());

module.exports = function (err, req, res, post) {

  if (err) {
    post(err, req, res);
    return;
  }

  var uSenderId = iWASession.getAuthUser(req.session).id;
  var chatId = req.processed.chatMessage.chat.id;
  var chatMsgPath = 'unread_chats.' + chatId;
  var conditions = {
    _id: ObjectId.fromString(uSenderId)

  };
  var update = {
    $unset: {}
  };

  conditions[chatMsgPath] = {$exists: true};
  update.$unset[chatMsgPath] = true;

  UserModel.findOneAndUpdate(conditions, update, function (err, user) {

    if (err) {
      post(new iWAErrors.Db('Controller: chat # Post-Middleware: ' +
        'updatesPostReadMessage | Error when updating the user\'s chat unread messages. ' +
        'Chat id: ' + chatId + ' / User id: ' + uSenderId, 521, err), req, res);
    }

    post(null, req, res);
  }); // end user update

};