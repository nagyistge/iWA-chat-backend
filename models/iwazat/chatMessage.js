'use strict';

/**
 * iWazat Message model
 *
 * This schema has fields that reference to other documents: The models names that reference, are:
 * User
 */
module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var iWAUser = require('./user');
var iWAMessage = require('./abstract/message');
var iWAChat = require('./chat');


/**
 * iWazat Message Chat model schema constructor.
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function ChatMessage(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }


  // Schema definition
  this.schemaDefinition.sender = {
    type: mongoose.SchemaTypes.ObjectId,
    ref: iWAUser.mongooseModelName
  };

  this.schemaDefinition.text = {
    type: String,
    required: true,
    match: /^(:?\s|.)+$/
  };


  // Call parent constructor
  //iWazat.call(this, this.schemaDefinition, schemaOptions);
  iWAMessage.call(this, schemaOptions);

};

ChatMessage.prototype.__proto__ = iWAMessage.prototype;


/**
 * @param {Object | String } chat Specify the current message collection in these ways:
 *    # {String} : The name of collection
 *    # {Object#currentChatMsgCollection()}: Function that return the name of the collection
 *    # {Object#currentChatMsgCollection}: String with the name of the collection
 *    # {Object#chat_msg_collection}: String with the name of the collection
 */
ChatMessage.prototype.mongooseModelOptions = function (chat) {

  if (!chat) {
    throw new Error('collection parameter is required (String or Mongoose iWazat Chat '
      + ' document)');
  }

  var msgChatCollection;

  if ('string' === typeof chat) {
    msgChatCollection = chat;
  } else if (chat.currentChatMsgCollection) {
    if (chat.currentChatMsgCollection instanceof Function) {
      msgChatCollection = chat.currentChatMsgCollection();
    } else {
      msgChatCollection = chat.currentChatMsgCollection;
    }
  } else if (chat.chat_msg_collection) {
    msgChatCollection = chat.chat_msg_collection;
  } else {
    throw new Error('It is not possible to inference the collection name from the chat parameter');
  }

  return {
    modelName: 'ChatMessage',
    collection: msgChatCollection,
    skipInit: {
      cache: false
    }
  };
};

/**
 * Return a new mongoose schema to attach to some fields of other schemas that crate documents
 * that need to reference to a chat message
 *
 * @returns {Object}
 */
ChatMessage.prototype.referenceSchema = function () {

  return new mongoose.Schema({
      chat_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: iWAChat.mongooseModelName,
        required: true
      },
      message_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: this.mongooseModelName,
        required: true
      },
      message_collection_num: {
        type: String,
        match: /\d{3}/,
        required: true
      }
    },
    {
      _id: false,
      id: true
    }
  )
    ;
};

var chatMessage = (function () {
  var chatMsg = new ChatMessage;
  chatMsg.ChatMessage = ChatMessage;

  return chatMsg;
}());


module.exports = exports = chatMessage;
