/** Event controller **/

module.exports = exports;


module.exports.global = {
    addError: require('./addError'),
    regTraceReq: require('./regTraceReq'),
    getTraceReq: require('./getTraceReq'),
    isUrlReserved: require('./isUrlReserved'),
		isThereAnyError: require('./isThereAnyError')
};

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
    respAllIssues: require('./actions/respAllIssues')
};



/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
    pre: {
      parseStandardQuery: require('./middlewares/pre/parseStandardQuery'),
      addProcessedData: require('./middlewares/pre/addProcessedData'),
      removeProcessedData: require('./middlewares/pre/removeProcessedData'),
      jumpIfErrors: require('./middlewares/pre/jumpIfErrors'),
      traceErrors: require('./middlewares/pre/traceErrors'),
      sendRespOfIssue: require('./middlewares/pre/sendRespOfIssue.js')
    },
    post: {
      errorsManager: require('./middlewares/post/errorsManager')
    }
};
