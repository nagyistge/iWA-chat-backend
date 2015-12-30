'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

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
 * Returns the event's callback function to use for a new message assessment
 * This function expects to receive the id of the message to assess. It performs the appropriated
 * assessment, adds or removes it, of the message depending of the user who requests it.
 *
 * If success, then the messageAssessment emitter is called sending the message assessment object,
 * which has the next fields:
 * {
 *    _id: The message id
 *    [add]: This field exists if the assessment has been added and contains the user id who sent
 *          the assessment
 *    [remove]: This field exists if the assessment has been removed and contains the user id who
 *          sent the assessment
 * }
 *
 * @param {Function} msgAssessmentEmitter the messages's assessment emitter for the server socket
 * @param {Object} MsgTimelineModel The message timeline mongoose model
 * @param {Object} userSessSocketData The user's session data stored for this namespace socket.
 *    Because this data is set when the client's socket connects, and it shouldn't be updated
 *    out of the connection listener function scope and those changes will not be used out of it,
 *    we use straight away the object rather than access to the session (connect session) in each
 *    call to enhance the performance.
 *    TODO Check that it works running a cluster (multiple server processes)
 * @returns {Function}
 */
module.exports = function (msgAssessmentEmitter, MsgTimelineModel, userSessSocketData) {

  return function (msgId, confirmFn) {
    try {  // Avoid some crash if comment is an unappropriated object

      MsgTimelineModel.assessMessage(msgId, userSessSocketData.actor._id,
        function (err, operation) {

          if (err) {
	          streamLogger.error('Service: events/timeline # Action: listeners/messageAssessment | ' +
              'Error to assess the message with id: ' + msgId + ' | Details :' + err);
            confirmFn(false);
            return
          }

          if (1 === operation) {
            confirmFn(true);
            msgAssessmentEmitter({
              _id: msgId,
              add: userSessSocketData.view._id
            });

            return;
          }

          if (-1 === operation) {
            confirmFn(true);
            msgAssessmentEmitter({
              _id: msgId,
              remove: userSessSocketData.view._id
            });

            return;
          }

          // Weird case: any document updated
          confirmFn(false);
          streamLogger.warn('A message assessment didn\'t update any document in the database. ' +
            'Message\'s id: ' + msgId);
        });
    } catch (e) {
      confirmFn(false);
      streamLogger.warn('Exception in the service: events/timeline # Action: ' +
        'listeners/messageAssessment, maybe it was thrown because the comment received is of ' +
        'unappropriated format. Exception message: ' + e.message);
    }
  };
};