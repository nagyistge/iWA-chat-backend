'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Depencies
 */
// Utils
var sanitizer = require('validator').sanitize;
// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');

/**
 * Globals
 */
// Loggers
var streamLogger;


//Initialize the non straight away global variables
(function initialize() {
  streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');
}());


/**
 * Return the event's callback function to use for a new text message received.
 * This function returns the success or unsuccess confirmation the client. If success, then
 * the newMessage emitter is called sending an message's object.
 *
 * @see libs/iWazat/view/timeline/messages#iWazatTextMessageView
 *
 * @param {Function} newMessageEmitter the new message emitter for the server socket
 * @param {Object} MsgTimelineModel The message timeline mongoose model
 * @param {Object} userSessSocketData The user's session data stored for this namespace socket.
 *    Because this data is set when the client's socket connects, and it shouldn't be updated
 *    out of the connection listener function scope and those changes will not be used out of it,
 *    we use straight away the object rather than access to the session (connect session) in each
 *    call to enhance the performance.
 *    TODO Check that it works running a cluster (multiple server processes)
 * @returns {Function}
 */
module.exports = function (newMessageEmitter, MsgTimelineModel, userSessSocketData) {

  return function (text, confirmFn) {

    try {

      text = text.trimRight();
      text = sanitizer(text).xss();

      MsgTimelineModel.createIWAText(text, userSessSocketData.actor._id,
        userSessSocketData.actor.persona,
        function (err, iWATextMsg) {

          if (err) {
	          streamLogger.error('Service: events/timeline # Action: listeners/textMessage | Error ' +
              'to create a new timeline message | Details: ' + err);
            confirmFn(false);
          } else {

            confirmFn(true);

            newMessageEmitter(
              tmMessagesView.iWazatTextMessageView(
                iWATextMsg,
                userSessSocketData.view
              )
            );
          }
        });

    } catch (e) {
      confirmFn(false);
      streamLogger.warn('Exception in the service: events/timeline # Action: ' +
        'listeners/textMessage, maybe it was thrown because the message received is of ' +
        'unappropriated format. Exception message: ' + e.message);
    }
  };
};