/**
 * iWazat Event Stream plugin model
 *
 */
module.exports = exports;

/**
 * Dependencies
 */
var EventEmitter = require('events').EventEmitter;
var mongoose = require('mongoose');

/**
 * TODO document
 *
 * @param {Object} schema the instance of the Mongoose Schema to attach the new functionalities
 * @param {Object} options
 */
function ExpandUserDefaultPersonaPlugin(schema, options) {

  if ((!options) || (!options.methodName) || (!options.path)) {
    throw new Error(
      'The method name (methodName) and path are required options');
  }

  // Plugin configuration parameters
  var methodName = options.methodName;
  var path = options.path.split('.');
  var userFields = (options.userFields) ? options.userFields : {};
  var queryOptions = (options.queryOptions) ? options.queryOptions : {};
  var userModel = (options.userModel) ? options.userModel : 'User';
  var idFielName = (options.idFieldName) ? options.idFieldName : '_id';

  // Flow control variables
  var it;
  var lastPathIdx = path.length - 1;
  var currentPath;
  var currentSchema = schema;
  var tmpPath;
  var docPaths = [];
  var docPath = {};
  var pathType;

  for (it = 0; it < lastPathIdx; it++) {
    pathType = currentSchema.pathType(path[it]);

    if ((pathType !== 'real') && (pathType !== 'nested')) {
      throw new Error('Invalid path type; the field of the attribute ' + path[it]
        + ' is not of a real or nested type');
    }

    if (pathType === 'real') {
      tmpPath = path[it];
    } else {
      //if (pathType === 'nested') tmpPath = path[it] + '.' + path[++it];
      if (pathType === 'nested') {
        if (!tmpPath) {
          tmpPath = path[it];
        } else {
          tmpPath += '.' + path[it];
        }
        continue;
      }
    }

    currentPath = currentSchema.paths[tmpPath];

    docPath.path = tmpPath;
    tmpPath = null;

    if (currentPath instanceof mongoose.SchemaTypes.DocumentArray) {
      docPath.iterable = true;
      currentSchema = currentPath.schema;
    } else {
      docPath.iterable = false;
    }

    docPaths.push(docPath);
    docPath = {};

  }

  if (!tmpPath) {
    tmpPath = path[lastPathIdx];
  } else {
    tmpPath += '.' + path[lastPathIdx];
  }

  if ((currentSchema.pathType(tmpPath) !== 'nested')
    && (!currentSchema.paths[tmpPath] instanceof mongoose.SchemaTypes.DocumentArray)) {
    throw new Error('Invalid path type; the field of the attribute ' + tmpPath
      + ' is not nested type');
  }

  if (currentSchema.pathType(tmpPath) == 'nested') {
    docPath.iterable = false; // This parameter is not needed for the last one, although it is set
    tmpPath += '.';
  } else {
    currentSchema = currentSchema.paths[tmpPath].schema;
    docPath.iterable = true; // This parameter is not needed for the last one, although it is set
    tmpPath = '';
  }

  if (!currentSchema.paths[tmpPath + idFielName]) {
    throw new Error('Invalid path type; the field of the attribute ' + tmpPath
      + ' is not nested type');
  }

  docPath.path = path[lastPathIdx];
  docPaths.push(docPath);
  docPath = {};

  schema.methods[methodName] = function (userCallback) {

    var self = this;

    var populate = function (cDocField, callback) {
      var it;
      var elements;
      var populatedUsers = null;
      var populatedCounter = 0;
      var errors = false;
      var model = ('string' === typeof userModel) ? self.model(userModel) : userModel;

      if (cDocField instanceof mongoose.Types.DocumentArray) {
        elements = cDocField;
        populatedUsers = new Array(elements.length);
      } else {
        elements = [ cDocField ];
      }

      var collector = new EventEmitter;

      collector.on('error', function (err, pos) {
        if (!populatedUsers) {
          callback(err, null);
          return;
        }

        if (!errors) errors = {};
        errors[pos] = err;
        populatedCounter++;

        if (populatedCounter === populatedUsers.length) callback(errors, populatedUsers);

      });

      collector.on('user', function (user, pos) {
        if (!populatedUsers) {
          callback(null, user);
          return;
        }

        populatedUsers[pos] = user;
        populatedCounter++;

        if (populatedCounter === populatedUsers.length) callback(errors, populatedUsers);

      });

      for (it = 0; it < elements.length; it++) {
//        Return javascript plain object rather than mongoose documents instances
//
//        model.findById(elements[it][idFielName], userFields, queryOptions, (function (pos) {
//          return function (err, user) {
//            if (err) {
//              collector.emit('error', err, pos);
//              return;
//            }
//
//            if (!user) {
//              collector.emit('error', new Error('Unreferenced user; there is not any user with id: '
//                + elements[pos][idFielName]), pos);
//              return;
//            }
//
//            var persona = user.personas.id(elements[pos].persona);
//
//            if (!persona) {
//              collector.emit('error', new Error('Unreferenced user\'s persona; the user (id: ' +
//                user.id + ') doesn\'t have any persona with id: ' + elements[pos].persona), pos);
//              return;
//            }
//
//            user = user.toObject();
//            delete user.personas;
//            user.persona = persona.toObject();
//
//            collector.emit('user', user, pos);
//          }
//        }(it)));
        model.find( {
            _id: elements[it][idFielName],
            personas: { $elemMatch: { is_default: true}}
          },
          userFields, queryOptions, (function (pos) {
          return function (err, users) {
            if (err) {
              collector.emit('error', err, pos);
              return;
            }

            if ((!users) || (users.length === 0)) {
              collector.emit('error', new Error('Unreferenced user; there is not any user with id: '
                + elements[pos][idFielName]), pos);
              return;
            }

            var user = users[0];

            if ((!user.personas) || (!user.personas.length === 0)) {
              collector.emit('error', new Error('Unreferenced user\'s persona; the user (id: ' +
                user.id + ') doesn\'t have any default persona'), pos);
              return;
            }

            collector.emit('user', user, pos);
          }
        }(it)));
      }
    };

    var numOfLoops = 0;

    /**
     *
     */
    var traverseDoc = function (docPaths, cIdx, cDocField, fullPath, postInArr, arrLength) {
      var it;
      var callback;

      if (cIdx === docPaths.length - 1) {
        if (numOfLoops <= 1) fullPath = null;
        callback = getCallback(fullPath, postInArr, arrLength);
        populate(cDocField[docPaths[docPaths.length - 1].path], callback);
        return;
      }

      if (!fullPath) {
        fullPath = docPaths[cIdx].path;
      } else {
        if (postInArr !== undefined) fullPath += '[' + postInArr + ']';
        fullPath += '.' + docPaths[cIdx].path;
      }

      cDocField = cDocField[docPaths[cIdx].path];

      if (docPaths[cIdx].iterable) {
        numOfLoops++;
        for (it = 0; it < cDocField.length; it++) {
          traverseDoc(docPaths, cIdx + 1, cDocField[it], fullPath, it, cDocField.length);
        }
      } else {
        traverseDoc(docPaths, cIdx + 1, cDocField, fullPath);
      }

    };

    var cbCounters = 0;
    var numCallbacks = 0;
    var populatedUsers = null;
    var populatedErrors = null;

    var getCallback = function (fieldPath, posInArr, arrLength) {
      numCallbacks++;

      return function (errs, users) {
        cbCounters++;

        if ((numCallbacks === 1) && (numOfLoops === 0)) {
          process.nextTick(function () {
            userCallback(errs, users);
          });

        } else {
          if (posInArr !== undefined) {

            if (!fieldPath) {
              if (!populatedUsers) {
                populatedUsers = new Array(arrLength);
              }

              populatedUsers[posInArr] = users;

              if (errs) {
                if (!populatedErrors) populatedErrors = {};

                if (!populatedErrors) {
                  populatedErrors = new Array(arrLength);
                }
                populatedErrors[posInArr] = errs;
              }

            } else {

              if (!populatedUsers[fieldPath]) {
                populatedUsers[fieldPath] = new Array(arrLength);
              }

              populatedUsers[fieldPath][posInArr] = users;

              if (errs) {
                if (!populatedErrors) populatedErrors = {};

                if (!populatedErrors[fieldPath]) {
                  populatedErrors[fieldPath] = new Array(arrLength);
                }
                populatedErrors[fieldPath][posInArr] = errs;
              }
            }

          } else {
            populatedUsers[fieldPath] = users;

            if (errs) {
              if (!populatedErrors) populatedErrors = {};
              populatedErrors[fieldPath] = errs;
            }
          }

          if (cbCounters === numCallbacks) {
            process.nextTick(function () {
              userCallback(populatedErrors, populatedUsers);
            });
          }

        }
      };
    };

    traverseDoc(docPaths, 0, self);

  };

};

module.exports = ExpandUserDefaultPersonaPlugin;