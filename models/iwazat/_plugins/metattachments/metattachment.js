'use strict'


module.exports = exports;

/**
 * Dependencies
 */
var screen = require('screener').screen;

/**
 * Generic class to inherit for the metattachment types that will be required in your application
 * 
 * @param options
 */
function Metattachement(options) {

  var self = this;

  Object.defineProperty(self, 'typeName', {
    configurable : false,
    enumerable : true,
    get : function() {
      
      var type = self.metattPattern.type;
      
      if (type instanceof RegExp) {
        type = type.toString();
        type = type.substr(1, type.length - 2);
      } 
      
      return type.toString();
    }
  });
}

/**
 * @property typeName
 * @api public (read only)
 *
 * Description:
 * This property return the metattachment's type name whose value is used to store in the database
 * under type attribute
 * @see Metattachment constructor
 *
 *
 * @property metattPattern
 * @api public (read only)
 *
 * Description:
 * Meta-attachment object structure; inherited classes must define this property in the constructor
 * as an accessor descriptor (Object.defineProperty) without setter. The getter method must be
 * return an key-value object with the required and accepted types/values by the metattachment,
 * using the API defined by the screener node module.
 * 
 * The attribute is useful to check the values externally, due that each metattachment's type define
 * its own structure
 * @see Metattachment construnctor, screener {@link https://github.com/RushPL/node-screener}
 */

/**
 * 
 * @param {Object} data object to create the meta-attachment object to add to meta-attachments
 *          'documents array'
 * @returns {Object}
 */
Metattachement.prototype.create = function(data) {

  screen(data, this.metattPattern.data);

  if (!screen(data, this.metattPattern.data)) {
    throw Error('data object parameter must contain the next attributes: '
      + Object.getOwnPropertyNames(this.metattPattern.data));
  }

  return {
    type : this.typeName,
    data : data
  };
};


//
//Metattachement.prototype.validate = function(data) {
// return false;
//};


module.exports = Metattachement;
