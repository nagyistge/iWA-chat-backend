/**
 * This helper avoids to duplicate the hardcoded messages to send to the client of the common issues
 * which break the route pre-middleware/action chain because a strict condition has not been fulfilled
 *
 * NOTE: This helper doesn't trace the possible errors populate in the req.processed.errors, so
 *    another helper should be used to do it (@see controllers/_helpers/middlewares/pre/traceErrors.js)
 *    or simply to pop
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');


module.exports = function(req, res, statusCode, entityName) {

  switch(statusCode) {
    case 400:
      res.json(400, {
        message: 'Bad ' + entityName + ' request'
      });
      break;
    case 401:
      res.json(401,  {
        message: 'Unauthenticated ' + entityName
      });
      break;
    case 403:
      res.json(403, {
        message: 'Unauthorized ' + entityName
      });
      break;
    case 500:
      res.json(500, {
        message: 'Our appologies, we have detected an application issue, please try to execute ' +
          'again your last action'
      });
      break;
    default:
      res.json(statusCode);
  }
};