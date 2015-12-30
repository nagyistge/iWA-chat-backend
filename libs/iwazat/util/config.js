'use strict';

/* Helper functions to load configurations from iWazat configuration file structures */
module.exports = exports;
var settings = require('../../../settings');

/**
 *
 * @param {Object} configObj An object id to compare
 * @param {String} [scope] The other object id to compare
 * @return {Object}
 */
module.exports.getConfiguration = function (configObj, scope) {


  try {
    if (!configObj[settings.app.id]) {
      throw new Error('Unspecified configuration for this application: ' + settings.app.id);
    }

    if (!configObj[settings.app.id][settings.env]) {
      throw new Error('Unspecified configuration for this environment: ' + settings.app.id);
    }

    if (scope === undefined) {
      return configObj[settings.app.id][settings.env];
    } else {
      return getSpecifiedConfigOrDefault(configObj[settings.app.id][settings.env], scope);
    }

  } catch (err) {
    if ((err instanceof TypeError ) || (err instanceof ReferenceError)) {
      throw new Error('Malformed iWazat configuration file; original message error: ' + err.message);
    } else {
      throw err;
    }
  }

  return configParams;
};


/**
 * Get the specified configuration parameters from the configuration object's property (path)
 *
 * @param {Object} obj Object to get the property value specified by path parameter
 * @param {String} path Complete path, in dot notation
 * @return {*} The value of configuration parameters under the object's property
 * @throws Error if the path is unreachable or the property doesn\'t exist or its values is undefined
 *  and no default configuration exists
 */
function getSpecifiedConfigOrDefault (obj, path) {

  if ((!obj) || (!(obj instanceof Object))) throw new Error('obj parameter must be an object');

  var pathArray = path.split('.');
  var configParams = undefined;

  function dig(obj, nextPath) {

    if (configParams !== undefined) {
      return configParams;
    }

    if (obj[nextPath] === undefined) {
      if (obj['_default'] === undefined) {
        throw new Error('Configuration object doesn\'t contain the path: ' + path +
          ' and doesn\'t define a default parameters');
      } else {
        configParams = obj['_default'];
        return configParams;
      }
    }

    return obj[nextPath];
  }

  configParams  = pathArray.reduce(dig, obj);

  return configParams;
}
