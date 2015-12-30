/**
 * This helper trace the current errors in the appropriated logs.
 * The aim of this helper is trace de error before one pre-middleware is going to send a response, so
 * breaks the chain, because the pre-middleware's target is to check a strict condition to continue
 * executing the next pre-middlewares or action.
 *
 * NOTE: if the pre-middleware don't check a strict condition and the next pre-middleware or action
 * in the chain have to be executed (it will not send a response) if some error happens, then it
 * mustn't use this helper and it must use a helper to report the error to next pre-middlewares or
 * action (@see controllers/_helpers/addError.js)
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */

/**
 * Globals
 */
var logger = settings.logger;

/**
 * TODO #33
 *
 * This is a helper for premiddlewares to log all the error before jumping to the next('route') or
 * abort the route chain sending a response because some issue requires it.
 *
 * Example: authenticated user is required to continue the route chain, so if he is not
 * authenticated the pre-middleware sends a response, but before it calls to this helper to log
 * the issue
 */
module.exports = function(req, error) {

  // TODO Trace the error and req.processed.errors as well`
  console.log('helpers#middlewares#pre: traceErrors');
  console.log(error);

};