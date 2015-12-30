'use strict';

/**
 * The pre-middleware check the string received in the request's body in the 'message' parameter
 * an apply some filters to remove with spaces characters from the beginning and end and to remove
 * possible XSS vectors.
 *
 *  NOTE: This pre-middleware doesn't do any checking on req.body.chat object, only dispose it
 *  into req.processed.chatMessage.chat to a next pre-middleware or action process it
 *
 * The middleware report an error to the next middleware/action of the chain if the structure is
 * wrong otherwise populate req.processed.chatMessage.message object, which has the next attributes:
 *  {
 *    text: The text of the message
 *  }
 *
 *  Other parameters contained in the request's body will be ignored, so they won't be populated
 *  in the req.processed.chatMessage object.
 *
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.body must exist
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// Utils
var sanitizer = require('validator').sanitize;

/**
 * Globals
 */
var objectIdRegExp;

//Initialize the non straight away global variables
(function initialize() {
  objectIdRegExp = /^[0-9A-Fa-f]{24}$/;
}());


module.exports = function (req, res, next) {

  var accepted = false;
  var msgText = req.body.message;


  if ((msgText) && ('string' === typeof msgText.text) && (Object.keys(msgText).length === 1)) {

    msgText = msgText.text.trim();

    if (msgText.length > 0) {
      // The chat message is accepted, go forward
      msgText = sanitizer(msgText).xss();
      accepted = true;
    }
  }


  if (accepted === true) {
    helperPreMiddlewares.addProcessedData(req, 'chatMessage', {
      chat: req.body.chat,
      message: {
        text: msgText
      }
    }, false);
    next();
  } else {
    // Non-accepted chat message
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: user # Pre-middleware: parseChatMsgData | Chat\'s ' +
        'message data object has not been sent or it doesn\'t have the right structure', 400,
        req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message');
  }
};
