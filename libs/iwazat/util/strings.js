/* Helper functions for javascript strings */
module.exports = exports;

/**
 * It compares tow stringify ObjectIds regarding they are a string which represents 12-bytes BSON
 * type: 4-byte timestamp + 3-byte machine identifier + 2-byte process id + 3-byte counter, so the
 * function compares them in this way:
 * 
 * 1# Compare the four firsts bytes (Timestamp)
 * 
 * 2# Compare the last three bytes (Counter)
 * 
 * 3# Compare the three machine identifier bytes
 * 
 * 4# Compare the two process id bytes
 * 
 * @param {String} id1 An object id to compare
 * @param {String} id2 The other object id to compare
 * @return {Number} 0 if they are equal, 1 if id1 is greater than id2, otherwise -1
 */
module.exports.compareStringifyObjectId = function(id1, id2) {

  if (id1 === id2) return 0;
  
  var pId1 = id1.substr(0, 8);
  var pId2 = id2.substr(0, 8);
  
  if (pId1 < pId2) return -1;
  if (pId1 > pId2) return 1;
  
  pId1 = id1.substr(id1.length - 7);
  pId2 = id2.substr(id2.length - 7);
  
  if (pId1 < pId2) return -1;
  if (pId1 > pId2) return 1;

  pId1 = id1.substr(8, 6);
  pId2 = id2.substr(8, 6);
  
  if (pId1 < pId2) return -1;
  if (pId1 > pId2) return 1;
  
  pId1 = id1.substr(14, 4);
  pId2 = id2.substr(14, 4);
  
  if (pId1 < pId2) return -1;
  if (pId1 > pId2) return 1;
  
};