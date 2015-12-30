
/** Platform controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
exports.actions = {
	updateTwitterStatus: require('./actions/updateTwitterStatus')
};



/**
 * Export all the middlewares that the controller implements
 */
exports.middlewares = {
  pre: {
	  parseUnregUserInvitation: require('./middlewares/pre/parseUnregUserInvitation'),
	  composeUnregUserInvitationTweet: require('./middlewares/pre/composeUnregUserInvitationTweet')
  }
//  post: {
//  }
};
