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
 * Return the event's callback function to use for a new text comment received.
 * This function expects to receive the new comment object and the function to return the succcess or
 * unsuccess confirmation the client.
 * Comment object is an object with this attributes:
 * {
 *    msgId: The message id to add the comment
 *    comment: The comment's text
 * }
 *
 * If success, then the newComment emitter is called sending the message comment object.
 * @see libs/iWazat/view/timeline/messages#messageComment
 *
 * @param {Function} newCommentEmitter the comment emitter for the server socket
 * @param {Object} MsgTimelineModel The message timeline mongoose model
 * @param {Object} userSessSocketData The user's session data stored for this namespace socket.
 *    Because this data is set when the client's socket connects, and it shouldn't be updated
 *    out of the connection listener function scope and those changes will not be used out of it,
 *    we use straight away the object rather than access to the session (connect session) in each
 *    call to enhance the performance.
 *    TODO Check that it works running a cluster (multiple server processes)
 * @returns {Function}
 */
module.exports = function (newCommentEmitter, MsgTimelineModel, userSessSocketData) {

  return function (commentObj, confirmFn) {
    try {  // Avoid some crash if comment is an unappropriated object

      commentObj.text = commentObj.text.trimRight();
      commentObj.text = sanitizer(commentObj.text).xss();

      MsgTimelineModel.addComment(commentObj.msgId, commentObj.text, userSessSocketData.actor._id,
        userSessSocketData.actor.persona,
        function (err, msgComments) {

          if (err) {
	          streamLogger.error('Service: events/timeline # Action: listeners/comment | Error ' +
              'to create a new comment for the message with id: ' + commentObj.msgId +
              ' | Details :' + err);
            confirmFn(false);
          } else {

            confirmFn(true);

            newCommentEmitter(
              tmMessagesView.messageComment(
                commentObj.msgId,
                msgComments[msgComments.length - 1],
                userSessSocketData.view, {commentToView: true}
              )
            );
          }
        });
    } catch (e) {
      confirmFn(false);
      streamLogger.warn('Exception in the service: events/timeline # Action: listeners/comment, ' +
        'maybe it was thrown because the comment received is of unappropriated format. Exception ' +
        'message: ' + e.message);
    }
  };
};