
/** Chat controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
  getUserChats: require('./actions/getUserChats'),
  newMessage: require('./actions/newMessage'),
  getMessages: require('./actions/getMessages')
};



/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
    pre: {
      parseMessageData: require('./middlewares/pre/parseMessageData'),
      authorization: require('./middlewares/pre/authorization'),
      getLastMessage: require('./middlewares/pre/getLastMessage'),
      parseMessageQuery: require('./middlewares/pre/parseMessageQuery'),
      retrieveReceivers: require('./middlewares/pre/retrieveReceivers')
    },
  post: {
    updatesPostNewMessage: require('./middlewares/post/updatesPostNewMessage'),
    updatesPostReadMessage: require('./middlewares/post/updatesPostReadMessage')
  }
};
