'use strict';
/**
 * Exist codes base on: http://www.gsp.com/cgi-bin/man.cgi?section=3&topic=sysexits
 *
 */

/**
 * Dependencies
 */
var farmer = require(__dirname + '/farmer');

var cleanExitCallback = function () {
  farmer.close();
  console.info('Twitter farmer shut down');
  process.exit(0);
};

var openCallback = function (err, confirmation) {

  if (err) {
    console.error(err);
    process.exit(70);
  }

  if (confirmation) {
    console.info('Twitter farmer running');

    process.on('SIGINT', cleanExitCallback);
    process.on('SIGTERM', cleanExitCallback);
  } else {
    console.warn('Twitter farmer confirmed that it is not running');
    process.exit(69);
  }
};


farmer.open(openCallback);

