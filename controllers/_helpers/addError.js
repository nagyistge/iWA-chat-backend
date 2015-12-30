module.exports = exports;

/**
 * Helper to add a new Error to the request. Following the coding convention, the controller will
 * add to the req.processed.errors array the new error if it exist, otherwise it will create a new
 * array and populate it with the supplied error. Optionally the method populate the
 * req.processed.res_status
 * 
 * @param {Object} error iWazat error instance (sys/entities/errors)
 * @param {Number} [statusCode] the status code to populate; NOTE that req.processed.res_status is a
 *          number field, not an array, so the value will be overridden
 */
module.exports = function(req, error, statusCode) {

  if (!req.processed) {
    req.processed = {
      errors : [ error ]
    };

  } else if (!req.processed.errors) {
    req.processed.errors = [ error ];

  } else {
    req.processed.errors.push(error);
  }

  if (statusCode) {
    req.processed.res_status = statusCode;
  }

};
