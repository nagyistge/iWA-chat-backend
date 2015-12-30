/* iWazat abstract model */

var Schema = require('mongoose').Schema;
var SchemaType = require('mongoose').SchemaType;
var _ = require('underscore');

/**
 * Abstract constructor
 * NOTE: The inherited non-abstract constructor must define schemaDefinition attribute.
 *
 * @param {object} schemaOptions The options of the Mongoose Schema; it will passed as the second
 *          argument of the Mongoose Schema constructor
 */
function IWazat(schemaOptions) {

  // Call parent constructor (Mongoose Schema)
  Schema.call(this, this.schemaDefinition, schemaOptions);

  Object.defineProperty(this, 'mongooseModelName', {
    configurable: true,
    enumerable: true,
    get: function () {
      throw new Error(
        'This iWazat model doesn\'t provide a mongoose model name because it is an abstract '
          + 'class or it is not generated straight away, so it is need to define this property in '
          + 'the inherited iWazat model or use mongooseModelOptions the built-in method to create '
          + 'mongoose model from this iWazat model');
      return false;
    }
  });
}

IWazat.prototype.__proto__ = Schema.prototype;

//IWazat.prototype.validators = {};
//IWazat.prototype.mongooseModelName;


IWazat.prototype.mongooseModelOptions = function () {
  return false;
};


IWazat.prototype.validateObject = function (object, schema) {


  if (!schema) {
    schema = this.schemaDefinition;
  } else {
    // Method cannot check an embedded Schema
    if (schema instanceof Schema) {
      return true;
    }
  }

  var self = this;
  var sf;
  var checkFlag;
  var retFailArr;
  var retFail;
  var retFailsAcc = {};
  var objValsIt;

  try {

    for (sf in schema) {

      if ('object' === typeof schema[sf]) {
        //if (schema[sf] instanceOf )
        if (Array.isArray(schema[sf])) {
          // The field hold an array

          if (!Array.isArray(object[sf])) {
            if (object[sf] !== undefined) {
              retFail = {};
              retFail[sf] = 'must be an array';

              _.extend(retFailsAcc, retFail);
            }

            continue;
          }

          retFailArr = [];
          object[sf].forEach(function (val) {
            retFail = self.validateObject(val, schema[sf][0]);

            if (!_.isEmpty(retFail)) {
              retFailArr.push(retFail);
            }
          });

          if (retFailArr.length > 0) {
            retFail = {};
            retFail[sf] = retFailArr;

            _.extend(retFailsAcc, retFail);
          }

        } else if (!schema[sf].type) {
          // The field hold an embedded object

          if ((!object) || (!object.hasOwnProperty(sf))) {
            continue;
          } else {
            if (!Array.isArray(object[sf])) {
              objValsIt = [object[sf]];
            } else {
              objValsIt = object[sf];
            }

            retFailArr = [];
            objValsIt.forEach(function (val) {
              retFail = self.validateObject(val, schema[sf]);

              if (!_.isEmpty(retFail)) {
                retFailArr.push(retFail);
              }
            });

            if (retFailArr.length > 0) {
              retFail = {};
              retFail[sf] = retFailArr;

              _.extend(retFailsAcc, retFail);
            }
          }
        } else {
          // The field hold a mongoose schema's type description object
          // Check the schema validations if they exist

          if (!object[sf]) {
            if ((schema[sf].required === true) && (schema[sf]['default'] === undefined)) {
              retFail = {};
              retFail[sf] = 'This field is required';

              _.extend(retFailsAcc, retFail);
            }

            continue;
          }

          if (!Array.isArray(object[sf])) {
            objValsIt = [object[sf]];
            retFailArr = false;
          } else {
            objValsIt = object[sf];
            retFailArr = [];
          }


          objValsIt.forEach(function (val, idx) {

            if ((schema[sf].required === true) && (schema[sf]['default'] === undefined)) {
              if (val === undefined) {
                retFail = {};
                retFail[sf] = 'This field is required';

                if (retFailArr === false) {
                  retFailArr = retFail;
                } else {
                  retFailArr.push(retFail);
                }

                return; // forEach
              }
            }

            if (schema[sf].min) {
              if (val < schema[sf].min) {
                retFail = {};
                retFail[sf] =
                  'This field must be a number greater or equal than: ' + schema[sf].min;

                if (retFailArr === false) {
                  retFailArr = retFail;
                } else {
                  retFailArr.push(retFail);
                }

                return; // forEach
              }
            }

            if (schema[sf].max) {
              if (val > schema[sf].max) {
                retFail = {};
                retFail[sf] = 'This field must be a number less or equal than: ' + schema[sf].max;

                if (retFailArr === false) {
                  retFailArr = retFail;
                } else {
                  retFailArr.push(retFail);
                }

                return; // forEach
              }
            }

            if (schema[sf].enum) {
              checkFlag = false;

              schema[sf].enum.forEach(function (val) {
                if (object[sf] === val) {
                  checkFlag = true;
                }
              });

              if (checkFlag === false) {
                retFail = {};
                retFail[sf] = 'This field must be one of next values: ' + schema[sf].enum;

                if (retFailArr === false) {
                  retFailArr = retFail;
                } else {
                  retFailArr.push(retFail);
                }

                return; // forEach
              }

            }

            if (schema[sf].match) {
              if (schema[sf].match.test(object[sf]) === false) {
                retFail = {};
                retFail[sf] = 'The field value doesn\'t match to the expected values';

                if (retFailArr === false) {
                  retFailArr = retFail;
                } else {
                  retFailArr.push(retFail);
                }

                return; // forEach
              }
            }
          });

          if ((Array.isArray(retFailArr)) && (retFailArr.length > 0)) {
            retFail = {};
            retFail[sf] = retFailArr;
            _.extend(retFailsAcc, retFail);

          } else if (retFailArr !== false) {
            _.extend(retFailsAcc, retFailArr);
          }
        }
      }
    }
  } catch (e) {
    //return false;
    retFail = {};

    if (sf) {
      retFail[sf] = e.message;
    } else {
      retFail['__unspecified__'] = e.message;
    }

    _.extend(retFailsAcc, retFail);
  }

  return (_.isEmpty(retFailsAcc)) ? true : retFailsAcc;

};

module.exports = exports = IWazat;
