'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Depencies
 */
// System
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');

// Sockets
var iWASocketIO = require(settings.servicesPath + '/iwazat/socket.io');

/**
 * Globals
 */
// Services
var twtConsumer;

// Loggers
var streamLogger;


//Initialize the non-straight away global variables and receive the twitter consumer instance
module.exports = function initialize(twitterConsumer) {
  twtConsumer = twitterConsumer;
  streamLogger = iwaLogger.getWinstonLogger('eventsStream');

  module.exports = close;
  // Allows chaining
  return close;
};


/**
 * Closes the socket namespace to manage the event timeline
 * @param {Object} event Mongoose event's document
 * @return {Boolean} True if the stream is closed in this call, otherwise false (stream was already
 *        closed)
 */
var close = function (event) {

  var nsId = '/event/' + event.id + '/stream';

  twtConsumer.unregisterEvent(event.id, event.message_collection_count);

  if (!iWASocketIO.isNamespaceUp(nsId)) {
    streamLogger.warn('Requested to close a closed stream timeline. Socket namespace: ' + nsId);
    return false;
  }

  iWASocketIO.shutDownNamespace(nsId);

  return true;
};