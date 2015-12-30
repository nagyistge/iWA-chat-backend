'user strict';



/**
 * This module performs all the operations require before the server is ready to access respond
 * client request.
 *
 * When the action finish call the provided callback passing an error if something was wrong
 *
 * @param callback
 */
module.exports = function (callback) {

  var settings = require('./settings.js');
  var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
  var iWAEvent = require(settings.modelsPath + '/iwazat/event');
  var timelineStream = require(settings.servicesPath + '/iwazat/events/timeline');

  timelineStream(function(err, twtConsumer) {

    if (err) {
      callback(err);
      return;
    }


    var EventModel = iWAMongo.model(iWAEvent);

    EventModel.find({
        timeline_status: 'open'
      }, {
        _id: true,
        message_collection_count: true,
        social_accounts: true
      },
      function (err, events) {

        if (err) {
          callback(err);
          return;
        }

        events.forEach(function (event) {
          timelineStream.open(event);
        });

        setTimeout(function() {
          twtConsumer.bootstrap();
        }, 3000 + (300 * events.length));


        callback();
      }
    );
  });

  delete module.exports;
};