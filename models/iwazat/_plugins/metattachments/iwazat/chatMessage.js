'use strict';

module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Metattachement = require('../metattachment');
var screen = require('screener').screen;

/**
 * ChatMessage metattachment constructor.
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @constructor
 * @param {Object} [options] Object with next attributes: it doesn't accept any option parameter
 */
function ChatMessage(options) {

  var self = this;

  Metattachement.call(self, options);

  Object.defineProperty(self, 'metattPattern', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {
      type: /chat_msg/,
      data: {
        chat_id: /[a-fA-F0-9]{24,24}/,
        message_id: /[a-fA-F0-9]{24,24}/,
        message_collection_num: /\d{3}/
      }
    }
  });

}

ChatMessage.prototype.__proto__ = Metattachement.prototype;

ChatMessage.prototype.create = function (data) {

  if (screen.exact(data, this.metattPattern.data) === undefined) {
    throw Error('Data\'s object must fit to the metapattern data field');
  }

  return {
    type: this.typeName,
    data: {
      chat_id: mongoose.Types.ObjectId.fromString(data.chat_id),
      message_id: mongoose.Types.ObjectId.fromString(data.message_id),
      message_collection_num: data.message_collection_num
    }
  };
};

ChatMessage.prototype.validate = function(data) {

  if (!(data.chat_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if (!(data.message_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  return this.metattPattern.data.message_collection_num.test(data.message_collection_num);
};

var chatMessage = (function () {
  var chatMsg = new ChatMessage();
  chatMsg.ChatMessage = ChatMessage;

  return Object.seal(chatMsg);
}());

module.exports = chatMessage;
