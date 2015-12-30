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
var mongoose = require('mongoose');
var iWazat = require('./../iWazat');
var iWAUser = require('./../../user');


/**
 * iWazat Actor model schema constructor. An iWazat actor is a reference to an iWazat user and one
 * of his personas, so an actor is how the rest of the iWazat users know, see or interact with him
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Actor(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition._id = {
    type: mongoose.SchemaTypes.ObjectId,
    ref: iWAUser.mongooseModelName,
    required: true
  };
  this.schemaDefinition.persona = {
    type: mongoose.SchemaTypes.ObjectId,
    required: true
  };


  if (!schemaOptions) {
    schemaOptions = {};
  }
/*
  if (!schemaOptions._id) {
    schemaOptions._id = false;
  }

  if (!schemaOptions.id) {
    schemaOptions.id = false;
  }*/

  // Call parent constructor
  iWazat.call(this, schemaOptions);

}

Actor.prototype.__proto__ = iWazat.prototype;

Actor.prototype.createActorFromObject = function(user) {
  return {
    _id: user.id,
    persona: user.persona.id
  };
};

Actor.prototype.createActor = function(userId, personaId) {
  return {
    _id:userId,
    persona: personaId
  };
};


var actor = (function () {
  var actor = new Actor;
  actor.Actor = Actor;

  return actor;
}());

module.exports = exports = actor;

