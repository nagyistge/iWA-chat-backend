'use strict';

module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Metattachement = require('../metattachment');
var screen = require('screener').screen;


/**
 * UserPublicPersona metattachment constructor.
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @param {Object} options Object with next attributes: it doesn't accept any option parameter
 */
function UserPublicPersona(options) {

  var self = this;

  Metattachement.call(self, options);

  Object.defineProperty(self, 'metattPattern', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {
      type: /user_pub_pers/,
      data: {
        user_id: /[a-fA-F0-9]{24,24}/
      }
    }
  });

}

UserPublicPersona.prototype.__proto__ = Metattachement.prototype;

UserPublicPersona.prototype.create = function (data) {

  if (screen.exact(data, this.metattPattern.data) === undefined) {
    throw Error('Data\'s object must fit to the metapattern data field');
  }

  return {
    type: this.typeName,
    data: {
      user_id: mongoose.Types.ObjectId.fromString(data.user_id)
    }
  };
};

UserPublicPersona.prototype.validate = function(data) {

  if (!(data.user_id instanceof  mongoose.Types.ObjectId)) {
    return false;
  }

  return true;
};

var userPublicPersona = (function () {
  var userPubPers = new UserPublicPersona();
  userPubPers.UserPublicPersona = UserPublicPersona;

  return Object.seal(userPubPers);
}());

module.exports = userPublicPersona;
