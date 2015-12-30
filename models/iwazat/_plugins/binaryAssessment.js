'use strict';

/**
 * Dependencies
 */
var mongoose = require('mongoose');


/**
 * TODO document
 *
 * NOTE: Mongoose doesn't attach well the path under DocumentArray path
 *
 *
 * @param {Object} schema the instance of the Mongoose Schema to attach the new functionalities
 * @param {Object} [options] The expected values are:
 *  # [path] The complete path to store the document's assessment field, by default assessments.
 *  # [userModel]: The name of the user model. If it is not provided then the field will hold elements,
 *      not embedded documents, otherwise it will be used to populate the mongoose 'ref' attribute
 *      of the field
 *  # [userProfileFieldName]: If only applies if the userModel parameters is provided and it is used
 *      to name a field in the embedded documents to hold the user profile used in the assessment.
 *  # [methodName]: Specify the name to create a method in the model (static), otherwise the method
 *        won't be created.
 *        The method create allows to add or remove the assessment depending if the element or _id
 *        of the embedded document, exists in the array or not. The callback function needs to define
 *        the node callback convention and if there isn't any error, the second parameter is an
 *        integer with -1 if the element was removed, 1 if the element was added and 0 if any so
 *        then any document exists with the provided id.
 *        The arity of the method has one more parameter if the field contains embedded documents;
 *        the parameters are:
 *          (1) document id: The document id that it will update
 *          (2) element value or id: The element to value or id value of the subdocument to add or
 *                remove
 *          (3) [profile id]: If the field contains embedded document with user id and profile id
 *                then the profile to id to use in the assessment
 *          (3 or 4) callback: The callback function mentioned above
 *
 * @return
 */
function binaryAssessmentPlugin(schema, options) {

  var path = 'assessments';
  var userModelName = false;
  var userProfileFieldName = false;
  var methodName = false;

  if (options) {
    path = (options.path) ? options.path : 'assessments';

    if (options.userModel) {
      userModelName = ('string' === typeof options.userModel) ? options.userModel
        : options.userModel.modelName;
    }

    if (options.userProfileFieldName) {
      userProfileFieldName = options.userProfileFieldName;
    }

    if (options.methodName) {
      methodName = options.methodName;
    }
  }

  var assessObj;

  if ('string' === typeof userModelName) {
    // Assessment field contains embedded documents
    assessObj = {
      type: 'array',
      cast: {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: userModelName
        }
      }
    };


    if (userProfileFieldName === false) {
      if ('string' === typeof methodName) {

        schema.static(methodName, function (docId, userId, callback) {
          var self = this;
          var filter = {
            _id: docId
          };
          var valToUpdate = {
            $pull: {}
          };
          var updateOptions = {
            upsert: false,
            multi: false
          };


          filter[path] = {
            $elemMatch: {
              _id: userId
            }
          };


          valToUpdate.$pull[path] = {
            _id: userId
          };


          this.update(filter, valToUpdate, updateOptions,
            function (err, numAffected) {
              var valToUpdate;

              if (err) {
                callback(err);
                return;
              }

              if (numAffected === 1) {
                // assessment removed
                callback(null, -1);
                return;
              }

              // assessment to add
              valToUpdate = {
                $push: {}
              };

              valToUpdate.$push[path] = {
                _id: userId
              };

              self.update(
                {
                  _id: docId
                },
                valToUpdate,
                updateOptions,
                function (err, numAffected) {
                  if (err) {
                    callback(err);
                    return;
                  }

                  if (numAffected === 1) {
                    // assessment added
                    callback(null, 1);
                  } else {
                    callback(null, 0);
                  }
                }
              );
            });
        });

      } // Method name has been provided
    } else {
      assessObj.cast[userProfileFieldName] = mongoose.SchemaTypes.ObjectId;

      if ('string' === typeof methodName) {

        schema.static(methodName, function (docId, userId, profileId, callback) {

          var self = this;
          var filter = {
            _id: docId
          };
          var valToUpdate = {
            $pull: {}
          };
          var updateOptions = {
            upsert: false,
            multi: false
          };


          filter[path] = {
            $elemMatch: {
              _id: userId
            }
          };


          valToUpdate.$pull[path] = {
            _id: userId
          };


          this.update(filter, valToUpdate, updateOptions,
            function (err, numAffected) {
              var valToUpdate;

              if (err) {
                callback(err);
                return;
              }

              if (numAffected === 1) {
                // assessment removed
                callback(null, -1);
                return;
              }

              // assessment to add
              valToUpdate = {
                $push: {}
              };

              valToUpdate.$push[path] = {
                _id: userId
              };

              valToUpdate.$push[path][userProfileFieldName] = profileId;

              self.update(
                {
                  _id: docId
                },
                valToUpdate,
                updateOptions,
                function (err, numAffected) {
                  if (err) {
                    callback(err);
                    return;
                  }

                  if (numAffected === 1) {
                    // assessment added
                    callback(null, 1);
                  } else {
                    callback(null, 0);
                  }
                }
              );
            });
        });
      } // Method name has been provided
    }
  } else {
    // Assessment field contains elements
    assessObj = [mongoose.SchemaTypes.ObjectId];

    if ('string' === typeof methodName) {
      //this.static('assessMessage', function (msgId, aUserId, aPersonaId, callback) {
      schema.static(methodName, function (docId, userId, callback) {

        var self = this;
        var filter = {
          _id: docId
        };
        var valToUpdate = {
          $pull: {}
        };
        var updateOptions = {
          upsert: false,
          multi: false
        };


        filter[path] = userId;
        valToUpdate.$pull[path] = userId;


        this.update(filter, valToUpdate, updateOptions,
          function (err, numAffected) {
            var valToUpdate;

            if (err) {
              callback(err);
              return;
            }

            if (numAffected === 1) {
              // assessment removed
              callback(null, -1);
              return;
            }

            // assessment to add
            valToUpdate = {
              $push: {}
            };

            valToUpdate.$push[path] = userId;

            self.update(
              {
                _id: docId
              },
              valToUpdate,
              updateOptions,
              function (err, numAffected) {
                if (err) {
                  callback(err);
                  return;
                }

                if (numAffected === 1) {
                  // assessment added
                  callback(null, 1);
                } else {
                  callback(null, 0);
                }
              }
            );
          });
      });
    } // Method name has been provided
  }

  schema.path(path, assessObj);
}

module.exports = binaryAssessmentPlugin;