'use strict';

module.exports = exports;


module.exports = function (callback) {
  var twtConsumer = require('./twitter/consumer');

    twtConsumer(function (err, confirmation) {

    if (err) {
      callback(err);
      return;
    }

    if (confirmation) {


      module.exports.open = require('./open')(twtConsumer);
      module.exports.close = require('./close')(twtConsumer);
	    module.exports.updateTwitterFilter = require('./updateTwitterFilter')(twtConsumer);

      callback(null, twtConsumer);

    } else {
      callback(new Error('Twitter consumer confirmed that it is not running'));
    }

  });

};

