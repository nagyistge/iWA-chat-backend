'use strict';

module.exports = exports;
var settings = require('../../settings.js');

/**
 * Globals
 */
var urlRegex;

//Initialize the non straight away global variables
(function initialize() {

  urlRegex = /^(?:\/([^?#]*))+/i;

}());


/**
 *
 * @param req
 * @return {Boolean}
 */
module.exports = function(req) {
  var reservedPathWords = settings.wireXRoutes.routePathWords;
  //var pathWords = req.url.match(/^(?:\/([^?#]*))+(?:.)*/i);
  var pathWords = req.url.match(urlRegex);

  //malformed url it shouldn't happen
  if (pathWords === null) {
    return true;
  }

  pathWords = pathWords[1].split('/');
  var word;

  for (var wi = 0, level = 1; wi < pathWords.length; wi++, level++) {

    // Check that the word not be an express route parameter
    word = pathWords[wi];

    if (pathWords[wi].length === 0) {
      continue;
    }

    if (pathWords[wi][0] !== ':') {
      if ((reservedPathWords[word]) && (reservedPathWords[word].indexOf(level) >= 0)) {
        return true;
      }
    }
  }

  return false;
};