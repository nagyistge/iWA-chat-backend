/** iWazat API controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
  twitterAPIGet: require('./actions/twitterAPIGet'),
	twitterAPIHelpConfig: require('./actions/twitterAPIHelpConfig')
};


/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
  pre: {
    twitterAPIGetQueryParser: require('./middlewares/pre/twitterAPIGetQueryParser'),
    twitterAPIWhiteListFilter: require('./middlewares/pre/twitterAPIWhiteListFilter')
  }
//  post: {
//  }
};
