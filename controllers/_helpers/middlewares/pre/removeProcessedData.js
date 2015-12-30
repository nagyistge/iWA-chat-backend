module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
var objUtils = require(settings.libsPath + '/iwazat/util/objects');

/**
 * Helper for pre-middlewares that allows to remove  data from the req.processed to follow
 * the coding conventions to pass parameters through of the pre-middlewares chain.
 * 
 * @param {Object} req The request object
 * @param {Object} propertyPath The full property path of that will hold the data object under
 *          req.processed
 * @param {Function} [next] The next() function used in the pre-middlewares; if it it is supplied
 *          the function will call it, so the caller pre-middleware mustn't call it
 * @throws Error if override is false or not specified and there is a named property into
 *           req.processed like the supplied name
 */
module.exports = function(req, propertyPath, next) {


  if (!req.processed) {
    if (next) {
      next();
    } else {
      return undefined;
    }
  }

  var propValue = objUtils.removeObjectPropValue(req.processed, propertyPath);

  if (next) {
    next();
  } else {
    return propValue;
  }
};
