'use strict';

/**
 * iWazat Notification model
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

var metattachments = require('./_plugins/metattachments');

/**
 * iWazat Notification model schema constructor
 *
 * The exports of the this module is an sealed instance of this class.
 *
 * @constructor
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Notification(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition.created_at = {
    type: Date,
    required: true,
    'default': Date.now
  };

  this.schemaDefinition.status = {
      type: String,
      enum: [ 'read', 'unread' ],
      required: true,
      'default': 'unread'
  };

  // This field must store the data when the note change from initial status to another one
  this.schemaDefinition.view_at = {
    type: Date
  };

  this.schemaDefinition.content = {
    title: {
      type: String,
      required: true,
      match: /^[^\n\r\v\0\t]*$/
    },
    text: {
      type: String,
      required: true
    }
  };


  if (!schemaOptions) {
    schemaOptions = {
      collection: 'notifications'
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'notifications';
    }
  }

  // Call parent constructor
  //iWazat.call(this, this.schemaDefinition, schemaOptions);
  iWazat.call(this, schemaOptions);

  var metattachmentsList = metattachments.plugin(this, {
    path: 'entities',
    types: [metattachments.iWazat.timelineMessage, metattachments.iWazat.commentMsgTimeline,
      metattachments.iWazat.chatMessage]
  });

}

Notification.prototype.__proto__ = iWazat.prototype;

Notification.prototype.mongooseModelOptions = function (user) {

  if (!user) {
    throw new Error('user parameter is required (string or Mogoose iWazat User document');
  }

  if ('object' === typeof user) {
    user = user.id;
  }

  return {
    modelName: 'Notification',
    collection: this.options.collection + '_' + user,
    skipInit: {
      cache: false
    }
  };
};


var notification = (function () {
  var notification = new Notification();
  notification.Notification = Notification;

  return notification;
}());

module.exports = notification;

