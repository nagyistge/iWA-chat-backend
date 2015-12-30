

module.exports = exports;
var settings = require('../../settings.js');


/**
 *
 * @param {String} actionType: suggest, redirect, logout, ...
 * @param {String} entityScope
 * @param {String} whichAction
 * @param {Object} dataObj
 * @return {Object}
 */
module.exports.createReportObject = function (actionType, entityScope, whichAction, dataObj) {

  return {
    action: actionType,
    scope: entityScope,
    which: whichAction,
    data: dataObj
  };

};