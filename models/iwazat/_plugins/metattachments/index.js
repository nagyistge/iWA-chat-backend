module.exports = exports;

// Plugin function
module.exports.plugin = require('./plugin');

// Metattachment implemented types
module.exports.iWazat = {
  userPublicPersona: require('./iwazat/userPublicPersona'),
  eventTimeline: require('./iwazat/eventTimeline'),
  timelineMessage: require('./iwazat/timelineMessage'),
  commentMsgTimeline: require('./iwazat/commentMsgTimeline'),
  chatMessage: require('./iwazat/chatMessage')
};
