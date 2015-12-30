'use strict';

module.exports = exports;
/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Metattachement = require('../metattachment');
var screen = require('screener').screen;

/**
 * EventTimeline metattachment constructor.
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @param {Object} options Object with next attributes: it doesn't accept any option parameter
 */
function EventTimeline(options) {

  var self = this;

  Metattachement.call(self, options);

  Object.defineProperty(self, 'metattPattern', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {
      type: /event_tmln/,
      data: {
        event_id: /[a-fA-F0-9]{24,24}/,
        timestamp: 'object'
      }
    }
  });
}

EventTimeline.prototype.__proto__ = Metattachement.prototype;

EventTimeline.prototype.create = function (data) {

  if (screen.exact(data, this.metattPattern.data) === undefined) {
    throw Error('Data\'s object must fit to the metapattern data field');
  }

  return {
    type: this.typeName,
    data: {
      event_id: mongoose.Types.ObjectId.fromString(data.event_id),
      timestamp: new Date(data.timestamp)
    }
  };
};

EventTimeline.prototype.validate = function(data) {

  if (!(data.event_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  if (!(data.timestamp instanceof Date)) {
    return false;
  }

  return true;
}


var eventTimeline = (function () {
  var eventTimeline = new EventTimeline();
  eventTimeline.EventTimeline = EventTimeline;

  return Object.seal(eventTimeline);
}());

module.exports = eventTimeline;
