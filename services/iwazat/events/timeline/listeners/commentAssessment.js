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
 * This function expects to receive a comment reference object to perform the appropriated
 * assessment, adds or removes it, of the comment depending of the user who requests it.
 * The comment reference is an object that has the next attributes:
 * {
 *    msgId: The message id owner of the comment
 *    cmtId: The comment's id
 * }
 *
 * If success, then the messageAssessment emitter is called sending the message assessment object,
 * which has the next fields:
 * {
 *    msgId: The message id
 *    cmtId: The comment id
 *    [add]: This field exists if the assessment has been added and contains the user id who sent
 *          the assessment
 *    [remove]: This field exists if the assessment has been removed and contains the user id who
 *          sent the assessment
 * }
 *
 * @param {Function} cmtAssessmentEmitter the comment's assessment emitter for the server socket
 * @param {Object} MsgTimelineModel The message timeline mongoose model
 * @param {Object} userSessSocketData The user's session data stored for this namespace socket.
 *    Because this data is set when the client's socket connects, and it shouldn't be updated
 *    out of the connection listener function scope and those changes will not be used out of it,
 *    we use straight away the object rather than access to the session (connect session) in each
 *    call to enhance the performance.
 *    TODO Check that it works running a cluster (multiple server processes)
 * @returns {Function}
 */
module.exports = function (cmtAssessmentEmitter, MsgTimelineModel, userSessSocketData) {

  return function (cmtRefObj, confirmFn) {
    try {  // Avoid some crash if comment is an unappropriated object

      MsgTimelineModel.assessComment(cmtRefObj.msgId, cmtRefObj.cmtId,
        userSessSocketData.actor._id,
        function (err, operation) {

          if (err) {
	          streamLogger.error('Service: events/timeline # Action: listeners/commentAssessment | ' +
              'Error to assess a comment (message id: ' + cmtRefObj.msgId + ' / comment id: ' +
              cmtRefObj.cmtId + ' | Details :' + err);
            confirmFn(false);
            return
          }

          if (1 === operation) {
            confirmFn(true);
            cmtAssessmentEmitter({
              msgId: cmtRefObj.msgId,
              cmtId: cmtRefObj.cmtId,
              add: userSessSocketData.view._id
            });

            return;
          }

          if (-1 === operation) {
            confirmFn(true);
            cmtAssessmentEmitter({
              msgId: cmtRefObj.msgId,
              cmtId: cmtRefObj.cmtId,
              remove: userSessSocketData.view._id
            });

            return;
          }

          // Weird case: any document updated
          confirmFn(false);
          streamLogger.warn('A comment assessment didn\'t update any document in the database. ' +
            '(message id: ' + cmtRefObj.msgId + ' / comment id:' + cmtRefObj.cmtId);
        });
    } catch (e) {
      confirmFn(false);
      streamLogger.warn('Exception in the service: events/timeline # Action: ' +
        'listeners/commentAssessment, maybe it was thrown because the comment received is of ' +
        'unappropriated format. Exception message: ' + e.message);
    }
  };
};