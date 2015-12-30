'use strict';

/**
 * Helper to know if some element of the route chain previously executed has reported an error into
 * the request
 *
 * @return {Boolean} true if there is some error otherwise false
 */
module.exports = function(req) {

  if ((req.processed) && (req.processed.errors)) {
    return true;
  }  
  
  return false; 
  
};
