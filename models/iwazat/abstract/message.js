'use strict';

/**
 * iWazat Message model
 *
 * This schema has fields that reference to other documents: The models names that reference, are:
 * User
 */
module.exports = exports;

/**
 * Dependencies
 */
var iWazat = require('./iWazat');


/**
 * iWazat Message model schema constructor.
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Message(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition.created_at = {
    type: Date,
    'default': Date.now
  };

  // Call parent constructor
  //iWazat.call(this, this.schemaDefinition, schemaOptions);
  iWazat.call(this, schemaOptions);

};

Message.prototype.__proto__ = iWazat.prototype;

module.exports = Message;
