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
var iWazat = require('./abstract/iWazat');
var iWAUser = require('./user');


/**
 * iWazat Chat model schema constructor
 *
 * The exports of the this module is an sealed instance of this class.
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Chat(schemaOptions) {

  var me = this;

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  // Schema definition
  this.schemaDefinition.created_at = {
    type: Date,
    'default': Date.now,
    required: true
  };

  this.schemaDefinition.last_message_at = {
    type: Date
  };

  this.schemaDefinition.members = [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: iWAUser.mongooseModelName,
      unique: true
    }
  ];

  this.schemaDefinition.message_collection_count = {
    type: String,
    'default': '001', // collection 000 is reserved for future use, for admin / favourites / etc
    match: /^\d{3}$/
  };


  if (!schemaOptions) {
    schemaOptions = {
      collection: 'chats'
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'chats';
    }
  }

  // Call parent constructor
  //iWazat.call(this, this.schemaDefinition, schemaOptions);
  iWazat.call(this, schemaOptions);

  Object.defineProperty(this, 'mongooseModelName', {
    enumerable: true,
    writable: false,
    value: 'Chat'
  });


  /**
   * Retrieve the users' chat or create a new one if it isn't exist   *
   */
  this.static('getChat', function (users, callback) {

    var self = this;

    if ((!users instanceof Array) || (users.length < 2)) {
      throw new Error('users parameter is required and has to be a string array with the ids of ' +
        'the users, or objects with an id (_id with ObjectId type and/or id with its stringify ' +
        ' version) property as well, involved in the chat')
    }

    if ('string' === typeof users[0]) {
      users = users.map(function (user) {
        return mongoose.Types.ObjectId.fromString(user);
      });
    } else {
      if (users._id) {
        users = users.map(function (user) {
          return user._id;
        });
      } else if (users.id) {
        users = users.map(function (user) {
          return mongoose.Types.ObjectId.fromString(user.id);
        });

      } else {
        throw new Error('users is an array but no of strings or object with _id (ObjectId type) ' +
          'or id (Stringify version of ObjectId) property');
      }
    }

    return this.findOne({members: {$all : users}}, function(err, chat) {
      if (err) {
        callback(err);
        return;
      }

      if (chat) {
        callback(null, chat);
      } else {
        // create the new chat that involve the specified uses
        self.create({
          members: users
        }, callback);
      }

    });

  });

  // Model methods
  this.static('currentChatMsgCollection', function (users, callback) {

    this.getChat(users, function(err, chat) {
      if (err) {
        callback(err);
        return;
      }

      if (!chat) {
        callback(null, null);
        return;
      }

      callback(null, chat.currentChatMsgCollection());
    });
  });


  /** Document virtual methods **/
  /***
   * @returns {String}
   * @api public
   */
  this.virtual('currentChatMsgCollection').get(function () {
    return me.resolveChatMessageCollectionName(this.id, this.message_collection_count);
  });

}

Chat.prototype.__proto__ = iWazat.prototype;


Chat.prototype.resolveChatMessageCollectionName = function (chatId, collectionNum) {
  return 'chat_messages_' + chatId + '_' + collectionNum;
}



var chat = (function () {
  var chat = new Chat;
  chat.Chat = Chat;

  return chat;
}());

module.exports = chat;

