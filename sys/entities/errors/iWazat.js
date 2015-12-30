module.exports = exports;

function iWazat(msgOrObj, dataObj) {

  Error.call(this);

  if (msgOrObj) {
    if ('string' === typeof msgOrObj) {
      this.message = msgOrObj;
    } else if ('object' === typeof msgOrObj) {
      for (var attr in msgOrObj) {
        if (msgOrObj.hasOwnProperty(attr)) {
          this[attr] = msgOrObj[attr];
        }
      }
    }
  }

  if (dataObj) {
    this.data = dataObj;

    if ((!this.message) && (dataObj.message)) {
      this.message = dataObj.message;
    }

    if (('number' !== typeof this.code) && (dataObj.code)) {
      this.code = dataObj.code;
    }

    if ((!this.stack) && (dataObj.stack)) {
      this.stack = dataObj.stack;
    }
  }
}

iWazat.prototype.__proto__ = Error.prototype;


/**
 * Information message about the error
 * @type {String}
 */
iWazat.prototype.message;

/**
 * Code of the error
 * @type {Number}
 */
iWazat.prototype.code;

/**
 * Error type; this attribute must be provided internally by the constructor of the inherited
 * classes.
 *
 * @type {String}
 * @api public (only for reading)
 */
iWazat.prototype.type;

/**
 * Raw error object (if it is provided an object when creating an instance)
 *
 * @type {Object}
 * @api public (only for reading)
 */
iWazat.prototype.data;

module.exports = iWazat;