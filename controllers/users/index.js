
/** Event controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
  getInfoFrom: require('./actions/getInfoFrom')
};



/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
    pre: {
      parseUsersReqParams: require('./middlewares/pre/parseUsersReqParams'),
	    checkInvitationUnregTwitterUser: require('./middlewares/pre/checkInvitationUnregTwitterUser')
    }
};
