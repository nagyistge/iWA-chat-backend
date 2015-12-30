'use strict';

module.exports = exports;
var settings = require('../../settings.js');


/**
 * Dependencies
 */
var objUtils = require(settings.libsPath + '/iwazat/util/objects');

/**
 * Helper to add to the session under '_trace' attribute some data under the specified id to get
 * this from next request which will come from the user and we can follow some deferred actions, for
 * example if we send a request to external service like 'external social networks login' and get
 * the request from them.
 *
 * @see controllers#_helpers#getTraceReq
 *
 * @param {Object} req The request object
 * @param {Object} id The full property path of that will hold the data object under
 *          session._trace
 * @param {Object} dataObj The data object
 * @param {Number} expiration Miliseconds that the data will be regarded expired
 * @param {Boolean} [override] Allows to override the data if it exists otherwise the function
 *          throws an error; by default false
 * @param {Function} callback Callback function (NodeJS convention) with the registered trace object
 *          as a second parameter
 *
 *     NOTE that this implementation is synchronous because the data is stored in the user's session
 *     however callback is required because maybe in the future the data will be stored in other
 *     place where its access is asynchronous
 */
module.exports = function (req, id, dataObj, expiration, override, callback) {

  var toReturn = false;

  if ((override) && ('function' === typeof override)) {
    callback = override;
    override = false;
  }

  if (req.session) {

    var traceObj = {
      timestamp: new Date(),
      expiration: expiration,
      route: {
        path: req.route.path,
        method: req.route.method,
        params: req.route.params,
        regexp: req.route.regexp
      },
      data: dataObj
    };

    try {
      objUtils.addPropertyOrAppendValue(req.session, '_trace.' + id, traceObj, override);
      toReturn = traceObj;
    } catch (e) {
      callback(e);
      return;
    }
  }

  callback(null, toReturn);
};