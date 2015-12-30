module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
var objUtils = require(settings.libsPath + '/iwazat/util/objects');

/**
 * Helper for pre-middlewares that allows to add new data into the req.processed property to follow
 * the coding conventions to pass parameters through of the pre-middlewares chain.
 * 
 * @param {Object} req The request object
 * @param {Object} propertyPath The full property path of that will hold the data object under
 *          req.processed
 * @param {Object} dataObj The data object
 * @param {Boolean} [override] Allows to override the data if it exists otherwise the function
 *          throws an error; by default false
 * @param {Function} [next] The next() function used in the pre-middlewares; if it it is supplied
 *          the function will call it, so the caller pre-middleware mustn't call it
 * @throws Error if override is false or not specified and there is a named property into
 *           req.processed like the supplied name
 */
module.exports = function(req, propertyPath, dataObj, override, next) {

	if ('function' === typeof override) {
		next = override;
		override = false;
	}

	if (!req.processed) {
		req.processed = {};
	}

	objUtils.addPropertyOrAppendValue(req.processed, propertyPath, dataObj, override);

	if (next) {
		next();
	}
};
