'use strict';
/**
 * Exist codes base on: http://www.gsp.com/cgi-bin/man.cgi?section=3&topic=sysexits
 *
 */

/**
 * Dependencies
 */
var dealer = require('./receiver');

var cleanExitCallback = function () {
  dealer.close();
  console.info('Twitter dealer shut down');
  process.exit(0);
};

var openCallback = function (err, confirmation) {

  if (err) {
    console.error(err);
    process.exit(70);
  }

  if (confirmation) {
    console.info('Twitter dealer running');

    process.on('SIGINT', cleanExitCallback);
    process.on('SIGTERM', cleanExitCallback);

  } else {
    console.warn('Twitter dealer confirmed that it is not running');
    process.exit(69);
  }
};



dealer.open(openCallback);
