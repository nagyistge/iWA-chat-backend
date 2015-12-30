'use strict';

module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Metattachement = require('../metattachment');
var screen = require('screener').screen;

/**
 * CommentMsgTimeline metattachment constructor.
 * 
 * The exports of the this module is an sealed instance of this class
 *
 * @param {Object} options Object with next attributes: it doesn't accept any option parameter
 */
function CommentMsgTimeline(options) {

  var self = this;

  Metattachement.call(self, options);

  Object.defineProperty(self, 'metattPattern', {
    configurable : false,
    enumerable : true,
    writable: false,
    value : {
        type : /cmt_tmln/,
        data : {
          event_id : /[a-fA-F0-9]{24,24}/,
          message_id : /[a-fA-F0-9]{24,24}/,
          comment_id : /[a-fA-F0-9]{24,24}/,
          message_collection_num: /\d{3}/
        }
      }
    });
}

CommentMsgTimeline.prototype.__proto__ = Metattachement.prototype;

CommentMsgTimeline.prototype.create = function(data) {


  if (screen.exact(data, this.metattPattern.data) === undefined) {
    throw Error('Data\'s object must fit to the metapattern data field');
  }

  return {
    type : this.typeName,
    data : {
      event_id : mongoose.Types.ObjectId.fromString(data.event_id),
      message_id : mongoose.Types.ObjectId.fromString(data.message_id),
      comment_id : mongoose.Types.ObjectId.fromString(data.comment_id),
      message_collection_num : data.message_collection_num
    }
  }; 
};

CommentMsgTimeline.prototype.validate = function(data) {

  if (!(data.event_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if (!(data.message_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if (!(data.comment_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  return this.metattPattern.data.message_collection_num.test(data.message_collection_num);
};


var commentMsgTimeline = (function() {
  var cmtMsgTmln = new CommentMsgTimeline();
  cmtMsgTmln.CommentMsgTimeline = CommentMsgTimeline;

  return Object.seal(cmtMsgTmln);
}());

module.exports = commentMsgTimeline;
