/**
 * This helper avoids to duplicate code in all the actions which expect that the
 * pre-middlewares haven't populate any response status code, therefore the action only will be
 * executed if there wasn't any issue.
 *
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 *
 * @return {Boolean} true if any pre-middleware populate the request with some issue, otherwise
 *         false.
 */
module.exports = function (req, res, post) {

  if (req.processed) {

    if (req.processed.errors) {

      var statusCode = req.processed.res_status;

      var jsonObj = {};

      // DB failure
      if ((statusCode >= 520) && ((statusCode < 530))) {
        jsonObj = {
          message: 'Our appologies, we have detected an application issue, please ' +
            'try to execute again your last action'
        };
      }
      if ((statusCode >= 620) && ((statusCode < 629))) {
        jsonObj = {
          message: 'Please ensure the information that you are providing is correct and ' + '' +
            'try to send it again',
          details: req.processed.errors[0].message
        };

      } else if (statusCode === 404) {
        if (req.processed.errors.length === 1) {
          jsonObj = {
            message: req.processed.errors[0].message
          };

          if (req.processed.errors[0].frontend_instruction) {
            jsonObj.instruction = req.processed.errors[0].frontend_instruction;
          }

        } else {
          jsonObj = {
            message: 'The requested url didn\'t provide any content'
          };
        }

      } else { // Default error, code is not matched
        jsonObj = {
          message: 'Please, repeat your last action, we could not process it'
        };
      }

      res.json(statusCode, jsonObj);
      post(req.processed.errors, req, res);
      return true;
    }

    // No errors but there is an status codes
    if ((req.processed.res_status) && (req.processed.res_status >= 400)) {
      // User sent a wrong authentication
      res.send(req.processed.res_status);
      post(null, req, res);
      return true;
    }

  }

  return false;

};