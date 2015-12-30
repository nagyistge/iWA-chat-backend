module.exports = exports;
var settings = require('../../../../settings.js');
var iWazatError = require(settings.sysPath + '/entities/errors/iWazat');

/**
 * Dependencies
 */

/**
 * Globals
 */
//var logger = settings.logger;
/**
 * TODO #33
 */
module.exports = function (err, req, res, post) {


  if (err) {
    console.warn('This function needs refactoring: ' + err);

    if (err instanceof Array) {

      err.forEach(function (e) {
        if (e instanceof iWazatError) {
          console.log("iWazatError: ");
          console.dir(e);

          if (e.stack) {
            console.log(e.stack);
          }

        } else {

          console.log(e);

          if (e.stack) {
            console.log(e.stack);
          }

          console.dir(e);
        }
      });

    } else {
      if (err instanceof iWazatError) {
        console.log("iWazatError: ");
        console.dir(err);

        if (err.stack) {
          console.log(err.stack);
        }
      } else {
        console.log(err);

        if (err.stack) {
          console.log(err.stack);
        }

        console.dir(err);
      }
    }
  }

  post(err, req, res);

};