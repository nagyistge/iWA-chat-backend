
/** User controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
	logout: require('./actions/logout'),
  currentSessionStatus: require('./actions/currentSessionStatus'),
  authEndPoint: require('./actions/authEndPoint'),
	retrieve: require('./actions/retrieve'),
	update: require('./actions/update'),
  favouriteUsers: require('./actions/favouriteUsersList'),
  addSocialNetwork: require('./actions/addSocialNetwork'),
  myEvents: require('./actions/myEvents')
};



/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
    pre: {
      parseAuthUrlParams: require('./middlewares/pre/parseAuthUrlParams'),
      authentication: require('./middlewares/pre/authentication'),
	    registration: require('./middlewares/pre/registration'),
      authUserChecker: require('./middlewares/pre/authUserChecker'),
      filterProfileData: require('./middlewares/pre/filterProfileData'),
      parseProfileData: require('./middlewares/pre/parseProfileData'),
      setAddSocialNetworkAcc: require('./middlewares/pre/setAddSocialNetworkAcc'),
	    getCurrentPersContactData: require('./middlewares/pre/getCurrentPersContactData')
    }
};
