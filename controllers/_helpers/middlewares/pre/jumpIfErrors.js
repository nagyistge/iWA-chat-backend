'use strict';

module.exports = exports;


/**
 * Helper for pre-middlewares that execute the next function if the request has been populated
 * (for example for the pre-middlewares executed before) with some error.
 * 
 * NOTE: If there is some error, next function is executed, so the pre-middleware's caller must not
 * call it.
 *
 * @return {Boolean} true if there is some error otherwise false
 */
module.exports = function(req, res, next) {

  if ((req.processed) && (req.processed.errors)) {
    next();
    return true;
  }  
  
  return false; 
  
};
