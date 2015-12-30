'use strict';


module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');

var _ = require('underscore');

//Metadata attachements types
var Metattachment = require('./metattachment');

/**
 * TODO document
 *
 *
 * @param {Object} schema the instance of the Mongoose Schema to attach the new functionalities
 * @param {Object} options The expected values are:
 *
 * # {String} path - The complete path to add the meta-attachment documents array
 *
 * # {Array} [types] - The Metattachment objects array supported by the meta-attachment document array.
 *    This is optional to allow to create the meta-attachment document array field in the schema,
 *    though the 'type' field of the meta-attachment subdocument will not be checked and no types will
 *    be registered so the document methods 'pushMetattachment' and 'unshiftMettachment' cannot
 *    perform their corresponding array operations but even thus they will be provided
 *
 * # {String} namespace - The string to prepend to the the names of the methods that this plugin
 *   provide to the documents. This is useful if the schema contains more than one field of
 *   meta-attachments array.
 *
 *
 * @return {*} The array which contains the supported meta-attachment's types names (used like validator
 * into the new schema added field) or false if no types were provided
 *
 */
function metattachmentsPlugin(schema, options) {

  if ((!options) || (!options.path)) {
    throw new Error('This plugin require path to store the document collection attributes\''
      + ' reference');
  }

  var path = options.path;
  var attachmentObj = {
    type: 'array',
    cast: {
      type: {
        type: String,
        required: true
      },
      data: mongoose.SchemaTypes.Mixed
    }
  };

  var it;
  var typesEnum = false;
  var typesAllowed = false;
  var methodsNS = (options.namespace) ? options.namespace : '';

  if (options.types) {
    if (!Array.isArray(options.types)) {
      throw new Error('Types options\' type parameter must be an array of metattachment objects');
    }

    if (options.types.length === 0) {
      throw new Error('It doesn\'t make sense to provide an empty array of metattachment objects');
    }

    typesEnum = Array(options.types.length);
    typesAllowed = {};

    for (it = 0; it < options.types.length; it++) {
      if (!options.types[it] instanceof Metattachment) {
        throw new Error('Found an element into the array options\' type parameter that doesn\'t '
          + 'inherit from Metattachemt object');
      }

      if (typesAllowed[options.types[it].typeName]) {
        throw new Error('There is other meta-attachment in the list with a type name: '
          + options.types[it].typeName);
      }

      typesEnum[it] = options.types[it].typeName;
      typesAllowed[options.types[it].typeName] = options.types[it];

    } // End types loop

    // Add the metattachment type to the mongoose enum validator of the attachment's 'type' field
    attachmentObj.cast.type.enum = typesEnum;

  } // End adding the attachement types

  schema.path(path, attachmentObj);

  // Setter definition
  schema.path(path).set(function (val) {

    var metattachments = [];
    var metattachObj;

    if (!Array.isArray(val)) {
      val = [val];
    }

    val.forEach(function (metaObj) {

      metattachObj = typesAllowed[metaObj.type];

      if (!metattachObj) {
        throw new Error('Unsupported metattachment type');
      }

      metattachments.push(metattachObj.create(metaObj.data));
    });

    return metattachments;
  });

  // Validator definition
  schema.path(path).validate(function (value) {
    var it;
    var metattachObj;

    for (it = 0; it < value.length; it++) {
      metattachObj = typesAllowed[value[it].type];

      if (!metattachObj) {
        return false;
      }

      if (!metattachObj.validate(value[it].data)) {
        return false;
      }

    }

    return true;

  }, 'Mettachment validation failed. Field: ' + path);

  /**
   * Returns an array with all the meta-attachments mongoose subdocuments that contain all of the
   * key-value pairs listed in the findCondition.
   *
   * NOTE: The method retrieve the subdocuments from the current local meta-attachment document
   * array so it does not retrieve documents from the database.
   *
   * @param {Object} findCondition key-value pairs to match with each meta-attachment subdocument
   * @return {Array} Array with the matched subdocuments
   */
  schema.methods[methodsNS + 'getMetattachments'] = function (findCondition) {
    return _.where(this.get(path), findCondition);
  };

  /**
   * Create a new one of the specified meta-attachment type and push it into meta-attachment
   * documents array
   *
   * @param {String} type - The registered type's name of the meta-attachment to create
   * @param {Object} data - The data's object that requires the specified meta-attachment's type
   *
   * @return {Object | undefined} The new subdocument or nothing
   *  @throws See the above paragraph of options parameter
   */
  schema.methods[methodsNS + 'pushMetattachment'] = function (type, data) {

    var metattachements = this.get(path);

    metattachements.push(typesAllowed[type].create(data));

    return _.last(metattachements);
  };

  /**
   * Create a new one of the specified meta-attachment type and unshift it into meta-attachment
   * documents array
   *
   * NOTE: mongoose array#unshift is not an atomic operation, and this method use it
   *
   * @param {String} type - The registered type's name of the meta-attachment to create
   * @param {Object} data - The data's object that requires the specified meta-attachment's type
   *
   * @return {Object | undefined} The new subdocument or nothing
   * @throws See the above paragraph of options parameter
   * @see mongoose array#unshift

   */
  schema.methods[methodsNS + 'unshifMetattachment'] = function (type, data) {

    var metattachements = this.get(path);

    metattachements.unshift(typesAllowed[type].create(data));

    return metattachements[0];
  };


  return typesEnum;
}

module.exports = metattachmentsPlugin;