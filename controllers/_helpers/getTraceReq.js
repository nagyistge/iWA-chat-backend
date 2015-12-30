'use strict';

module.exports = exports;
var settings = require('../../settings.js');


/**
 * Helper to get the information under property name specified by 'id' parameter attached to
 * session under '_trace' attribute and remove it.
 *
 * @see controllers#_helpers#regTraceReq

 * @param {Object} req The request object
 * @param {Object} id The full property path of that will hold the data object under
 *          session._trace
 * @param {Function} callback Callback function (NodeJS convention) with the result to the second
 *        parameter:
 *        {Object} :the trace object or
 *        {Null} if there is not object with the specified id
 *        {Boolean} False if the trace object has expired.
 *
 *     NOTE that this implementation is synchronous because the data is stored in the user's session
 *     however callback is required because maybe in the future the data will be stored in other
 *     place where its access is asynchronous.
 */
module.exports = function (req, id, callback) {

  var toReturn = null;

  if ((req.session) && (req.session._trace)) {
    toReturn = (!req.session._trace[id]) ? null : req.session._trace[id];

    if (toReturn !== null) {
      if (((new Date()) - req.session._trace[id].timestamp) < 0) {
        toReturn = false;
      }

      delete req.session._trace[id];
    }
  }

  callback(null, toReturn);
};