'use strict';


module.export = exports;

/**
 * Dependencies
 */
var screen = require('screener').screen;
var iWAObjs = require('./objects');

/**
 * Filter and apply the requirements of the provided query specification to the mongoose query
 * object.
 * The method is useful to parametrize the mongoose query from an specification received from an
 * unreliable source.
 *
 * NOTE: the method doesn't check the consistency of the required and blacklist objects, so their
 * values must be consistent with each other
 *
 * @param {Object} queryObj Mongoose query object instance
 * @param {Object} querySpec This object may has the next attributes:
 *                  {
 *                    conditions: Mongoose query conditions object
 *                    fields: Mongoose query fields object
 *                    options: Mongoose query options
 *                  }
 * @param {Object} requiredQuerySpec This object may has the next attributes, although limitMax is
 *                  required
 *                  {
 *                    conditions: This is an object of conditions mongoose style that specifies
 *                            fields or operators to always add to the conditions object
 *                    fields: Mongoose query fields object, with all the attribute assigned to true
 *                            which always will be retrieved with the query
 *                    limitMax: The maximum limit documents to retrieve
 *                  }
 * @param {Object} [blacklistQuerySpec] This object may has the next attributes:
 *                  {
 *                    conditions: Array with the banned fields or operators (remove deeply),
 *                    fields: The object specify the fields, which are banned to retrieve. The
  *                    value of the fields must be false.
 *                  }
 * @return {Object} The mongoose query object with the applied conditions, fields and options, to
 *                  allow the chaining
 */
module.exports = function (queryObj, querySpec, requiredQuerySpec, blacklistQuerySpec) {

  var conditions;


  if ((!requiredQuerySpec.limitMax) || ('number' !== typeof requiredQuerySpec.limitMax)) {
    throw new Error('requiredQuerySpec parameter with limitMax number attribute is required');
  }

  if (!blacklistQuerySpec) {
    blacklistQuerySpec = {};
  }

  queryObj.select(parseFields(querySpec.fields, requiredQuerySpec.fields,
    blacklistQuerySpec.fields));
  queryObj.setOptions(parseOptions(querySpec.options, requiredQuerySpec.limitMax));

  conditions = parseConditions(querySpec.conditions, requiredQuerySpec.conditions,
    blacklistQuerySpec.conditions);

  iWAObjs.mongoDBObjToJsObj(conditions);

  for (var c in conditions) {
    queryObj.where(c, conditions[c]);
  }

  return queryObj;

};

/**
 * Filter the conditions object add the default matching fields
 *
 * @param {Object} conditions The desired conditions
 * @param {Object} alwaysMatchCond This is an object of conditions mongoose style that specifies
 *              fields or operators to always add to the conditions object
 * @param {Array} blacklist The name of the fields or operators to remove. It is applied before
 *              add the alwaysMatchCond, so blacklist doesn't remove any field/operator specified
 *              in that.
 *              The blacklist is applied deeply, so if one field name is specified and the document
 *              contains that attribute in different levels (attribute's sub-documents), then
 *              it will removed from everywhere.
 * @returns {Object} The new conditions object
 */
function parseConditions(conditions, alwaysMatchCond, blacklist) {

  var condResult;

  if (blacklist) {
    condResult = iWAObjs.removeEmptyValues(
      iWAObjs.removeObjectProperties(conditions, blacklist, false, -1));
  } else {
    condResult = conditions;
  }


  for (var c in alwaysMatchCond) {
    condResult[c] = alwaysMatchCond[c];
  }

  return condResult;
}

/**
 * Parse the fields to get or not to get in MongoDB convention.
 * If the method received requiredFields and bannedFields, depending if the fields are specified
 * as getting or as not getting, then requiredFields and bannedFields are added or removed from
 * fields to return the parsed fields object to use in the query.
 * If fields is null or empty then bannedFields are returned, so the query should return all
 * the fields of the document except the banned fields.
 *
 *  NOTE: The method doesn't check if required and banned are consistent, so fields must only be
 * specified in one of them.
 *
 * @param {Object} fields Fields to get in MongoDB format (fields to true or false).
 * @param {Object} requiredFields Fields always to get. Expected the name of the fields like object
 *                attributes assigned to 'true'
 * @param {Object} bannedFields Banned fields. Expected the name of the fields like object
 *                attributes assigned to 'false'
 * @return {Object}
 */
function parseFields(fields, requiredFields, bannedFields) {

  var field;
  var fieldsToApply;
  var type = 0;


  if ((fields) && (Object.keys(fields).length > 0)) {

    for (field in fields) {

      if (fileds[field] === false) {

        if (type > 0) {
          throw new Error('MongoDB doesn\'t currently offer to mix including and excluding fields');
        }

        if (type === 0) {
          type = -1;
          fieldsToApply = iWAObjs.clonePlainObject(bannedFields);
        }

        if (requiredFields[field] === undefined) {
          fieldsToApply[field] = false;
        }

      } else {

        if (type < 0) {
          throw new Error('MongoDB doesn\'t currently offer to mix including and excluding fields');
        }

        if (type === 0) {
          type = 1;
          fieldsToApply = iWAObjs.clonePlainObject(requiredFields);
        }

        if (bannedFields[field] === undefined) {
          fieldsToApply[field] = true;
        }

      }
    }
  } else {

    fieldsToApply = bannedFields;
  }


  return fieldsToApply;
}

function parseOptions(options, limitMax) {

  if (!options) {
    options = {
      limit: limitMax
    };
  } else {
    options = screen(options, {
      sort: 'number',
      limit: 'number',
      skip: 'boolean',
      maxscan: 'number'
    });

    if ((options.limit !== undefined) && (options.limit === 0)) {

      if (options.limit < 0) {
        options.limit *= -1;
      }

      if (options.limit > limitMax) {
        options.limit = limitMax;
      }

    } else {
      options.limit = limitMax;
    }
  }
  return options;
}


