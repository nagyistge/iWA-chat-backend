'use strict';

module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Metattachement = require('../metattachment');
var screen = require('screener').screen;

/**
 * TimelineMessage metattachment constructor.
 * 
 * The exports of the this module is an sealed instance of this class
 *
 * @param {Object} [options] Object with next attributes: it doesn't accept any option parameter
 */
function TimelineMessage(options) {

  var self = this;

  Metattachement.call(self, options);

  Object.defineProperty(self, 'metattPattern', {
    configurable : false,
    enumerable : true,
    writable: false,
    value : {
        type : /msg_tmln/,
        data : {
          event_id : /[a-fA-F0-9]{24,24}/,
          message_collection_num : /\d{3}/,
          message_id : /[a-fA-F0-9]{24,24}/,
          message_created_at: 'string' // This field is duplicate but allows to get some timeline's
          // notes between times rather than message id. It is a date but we check it manually on
          // create method
        }
      }
    });

}

TimelineMessage.prototype.__proto__ = Metattachement.prototype;

TimelineMessage.prototype.create = function(data) {

  if (screen.exact(data, this.metattPattern.data) === undefined) {
    throw Error('Data\'s object must fit to the metapattern data field');
  }

  return {
    type : this.typeName,
    data : {
      event_id : mongoose.Types.ObjectId.fromString(data.event_id),
      message_collection_num : data.message_collection_num,
      message_id : mongoose.Types.ObjectId.fromString(data.message_id),
      message_created_at : new Date(data.message_created_at)
    }
  }; 
};

TimelineMessage.prototype.validate = function(data) {

  if (!(data.event_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if (!(data.message_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if ('string' !== typeof data.message_collection_num) {
    return false;
  }

 if (!data.message_created_at instanceof Date) {
      return false;
  }

  return true;
};



var timelineMessage = (function() {
  var timelineMsg = new TimelineMessage();
  timelineMsg.TimelineMessage = TimelineMessage;

  return Object.seal(timelineMsg);
}());

module.exports = timelineMessage;
