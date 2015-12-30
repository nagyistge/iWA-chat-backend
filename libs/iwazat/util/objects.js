/* Helper functions for javascript/JSON objects */
module.exports = exports;

/**
 * Dependencies
 */
var mongooseTypes = require('mongoose').Types;

/**
 * It creates an object and populates it with all the documents in array under a named attribute as
 * the document's id and add an array attribute name 'sort' that contains the rest of the attributes
 * names (document's id) in the same order of the provided documents array
 *
 * Note that this function expects an array of object that have an attribute or property named id
 *
 * @param {Array} docs
 * @returns {Object}
 */
module.exports.createSortedIdxMoongoseDocs = function (docs) {

	if (docs.length === 0) {
		return {
			sort: []
		};
	}

	var i = 0;
	var indexedObj = {
		sort: new Array(docs.length)
	};

	for (i = 0; i < docs.length; i++) {
		indexedObj[docs[i].id] = docs[i];
		indexedObj.sort[i] = docs[i].id;
	}

	return indexedObj;

};

/**
 * Function that remove properties with the supplied names
 *
 * @param {Object} obj The object from the properties will be removed
 * @param {Array} propertiesNames The names of the properties to remove
 * @param {Boolean} [ignoreCase] True to ignore the case of the properties names otherwise false.
 *          Default: true.
 * @param {Number} [maxDeep] The maximum deep that the object will be traversed; if the value is
 *          negative, then the object will be completely traversed otherwise the method doesn't look
 *          at the deeper properties. Default: -1.
 */
module.exports.removeObjectProperties = function (obj, propertiesNames, ignoreCase, maxDeep) {

	if ('boolean' !== typeof ignoreCase) {
		if (('number' === typeof ignoreCase) && (maxDeep === undefined)) {
			maxDeep = ignoreCase;
		}

		ignoreCase = true;
	}

	if ('number' !== typeof maxDeep) {
		maxDeep = -1;
	}

	var attrName;

	for (attrName in obj) {
		if (ignoreCase) {
			for (var p = 0; p < propertiesNames.length; p++) {
				if (attrName.toLowerCase() == propertiesNames[p].toLowerCase()) {
					delete obj[attrName];
				} else {
					if (typeof obj[attrName] == 'object') {
						if (maxDeep !== 0) {
							if (maxDeep < 0) {
								obj[attrName] = this.removeObjectProperties(obj[attrName],
									propertiesNames, ignoreCase, -1);
							}
							else {
								attrName[attrName] = this.removeObjectProperties(obj[attrName], propertiesNames,
									ignoreCase, maxDeep - 1);
							}

						}
					}
				}
			} // End loop of properties names to remove
		} else { // The same of above but with case sensitive
			for (var p = 0; p < propertiesNames.length; p++) {
				if (attrName == propertiesNames[p]) {
					delete obj[attrName];
				}
				else {
					if (typeof obj[attrName] == 'object') {
						if (maxDeep != 0) {
							if (maxDeep < 0) {
								obj[attrName] = this.removeObjectProperties(obj[attrName],
									propertiesNames, ignoreCase, -1);
							}
							else {
								attrName[attrName] = this.removeObjectProperties(obj[attrName], propertiesNames,
									ignoreCase, maxDeep - 1);
							}

						}
					}
				}
			} // End loop of properties names to remove
		}
	} // End loop of properties object of this deep level

	return obj;
};

/**
 * Add a property's value to the specified object under the provided dot notation path; if the
 * property is an array the method add the value to value to it.
 *
 * The method add as properties as required to reach the specified path's depth.
 *
 * @param {Object} obj Object to add the property value specified by path parameter
 * @param {String} path Complete path, in dot notation
 * @param {*} value Value to assign to the property specified by path
 * @param {Boolean} [override] Flag to specify that if the property exists in the object, then it
 *      be overridden; by default is false
 * @return {*} The provided object
 * @throws Error if the path is unreachable or the property doesn't exist or its values is undefined
 */
module.exports.addPropertyOrAppendValue = function (obj, path, value, override) {

	if ((!obj) || (!(obj instanceof Object))) {
		throw new Error('obj parameter must be an object');
	}

	var pathArray = path.split('.');
	var lastIndex = pathArray.length - 1;

	function dig(obj, nextPath, idx) {
		var nextObj;

		if (!(nextPath in obj)) {
			nextObj = obj[nextPath] = (idx === lastIndex) ? value : {};
		} else {
			if (Array.isArray(obj[nextPath])) {
				nextObj = (idx === lastIndex) ? value : {};
				obj[nextPath].push(nextObj);
			} else if (obj[nextPath] instanceof Object) {

				if (idx === lastIndex) {
					if (true !== override) {
						throw new Error('the path exist and override has not been allowed ');
					}
					//No more iterations so it is not needed assign value to nextObj
					obj[nextPath] = value;
				} else {
					nextObj = obj[nextPath];
				}

			} else {
				if (true !== override) {
					throw new Error('some part of the path contains a non-object element and  override '
						+ ' has not been allowed');
				}

				nextObj = obj[nextPath] = (idx === lastIndex) ? value : {};
			}
		}

		return nextObj;
	}

	pathArray.reduce(dig, obj);

	return obj;
};

/**
 * Return the property's value from the specified object from the provided dot notation path.
 *
 * @param {Object} obj Object to get the property value specified by path parameter
 * @param {String} path Complete path, in dot notation
 * @param {Boolean} [notThrowErrs] False then error will be throw if the path it is not valid
 *      in the specified object, otherwise the method returns undefined. By default false;
 * @return {*} The value from the specified object's property or undefined (it notThrowErrs is true)
 * @throws Error if the path is unreachable or the property doesn\'t exist or its values is undefined
 */
module.exports.getObjectPropValue = function (obj, path, notThrowErrs) {

  if ((!obj) || (!(obj instanceof Object))) {
    if (notThrowErrs) {
      return undefined;
    } else {
      throw new Error('obj parameter must be an object');
    }
  }

	function dig(obj, nextPath) {

		if (obj === undefined) {
			if (notThrowErrs) {
				return obj;
			} else {
				throw new Error('The object doesn\'t have the property: ' + path);
			}
		}

		return obj[nextPath];
	}

	var pathArray = path.split('.');
	var propValue = pathArray.reduce(dig, obj);

	if (propValue === undefined) {
		if (notThrowErrs) {
			return undefined;
		} else {
			throw new Error('The object doesn\'t have the property: ' + path);
		}
	} else {
		return propValue;
	}
};


/**
 * // TODO test and implements if it's needed, the possibility to get properties into the Array.
 *
 * @param {Object} obj Object to get the property value specified by path parameter
 * @param {String} path Complete path, in dot notation
 * @return {*} The value from the specified object's property if it exists, otherwise undefined
 */
module.exports.removeObjectPropValue = function (obj, path) {

	if ((!obj) || (!(obj instanceof Object))) {
		return undefined;
	}

	var pathArray = path.split('.');
	var propIdx = pathArray.length - 1;
	var objHoldRefToRemove = false;
	var propRefToRemove = false;
	var toRetIt;

	function dig(obj, nextPath, idx) {

		// stop if path is longer thant the object contains
		if (objHoldRefToRemove) {
			return;
		}

		toRetIt = obj[nextPath];

		if ((!(toRetIt instanceof Object)) || (propIdx <= idx)) {
			objHoldRefToRemove = obj;
			propRefToRemove = nextPath;
			// ensure that the last call doesn't override the propRefToRemove
			propIdx = pathArray.length;
		}

		// Return the object to traverse deeper
		return toRetIt;
	}

	pathArray.reduce(dig, obj);
	var propValue = objHoldRefToRemove[propRefToRemove];

	if ((objHoldRefToRemove) && (objHoldRefToRemove.hasOwnProperty(propRefToRemove))) {
		delete objHoldRefToRemove[propRefToRemove];
	}

	return propValue;
};


/**
 * This method make a copy of a plain object using JSON methods
 *
 * @param object
 * @return {*}
 * @see JSON.stringify and JSON.parse
 */
module.exports.clonePlainObject = function (object) {
	return JSON.parse(JSON.stringify(object));
};


/**
 *
 * @param {Object} fullObj
 * @param {Object} subObj
 * @return {Object}
 */
module.exports.subtractObjectProperties = function (fullObj, subObj) {

	var p;

	if (Array.isArray(fullObj)) {
		if (Array.isArray(subObj)) {
			for (p = 0; p < fullObj.length; p++) {
				if (subObj[p] !== undefined) {
					if ((fullObj[p] !== null) && ('object' === typeof fullObj[p])) {
						this.subtractObjectProperties(fullObj[p], subObj[p]);
					} else {
						// If the elements of the array aren't objects and teh subObj for the current
						// position is a value different from undefined then the method replace the value
						// of that position by 'undefined'
						fullObj[p] = undefined;
					}
				}
			}
		}
	} else {
		for (p in subObj) {
			if ('object' === typeof subObj[p]) {
				if (fullObj.hasOwnProperty(p)) {
					this.subtractObjectProperties(fullObj[p], subObj[p]);
				}
			} else {
				delete fullObj[p];
			}
		}
	}

	return fullObj;
};

/**
 * Remove the object attributes whose value is Null, an empty array or an empty object if they
 * are not specified in keep object. The method walks recursively the object to search into the
 * sub-objects
 *
 * @param {Object} obj The object to remove the empty fields
 * @param {Object} [keep] An object with the attributes 'null', 'array' and/or 'object' to specify
 *          not to delete the fields which value if one of them of the obj. The value assigned
 *          to those fields is ignored, so it can be any value except undefined
 * @return {Object}
 */
module.exports.removeEmptyValues = function (obj, keep) {

	for (var p in obj) {

		if (obj[p] === null) {
			if (keep['null'] === undefined) {
				delete obj[p];
			}
		} else if (Array.isArray(obj[p])) {
			if ((obj[p].length === 0) && (keep['array'] === undefined)) {
				delete obj[p];
			}
		} else if ('object' === typeof obj[p]) {
			if (Object.keys(obj).length === 0) {
				if (keep['object'] === undefined) {
					delete obj[p];
				}
			} else {
				this.removeEmptyValues(obj[p], keep);
			}
		}
	}

	return obj;
};

/**
 * Update the values from the mongoose object which are present in the update plain object taking
 * in account that if the property's type is a DocumentArray, then it tries to match the document
 * into the array using the id and if it doesn't exist a document with that id then it will add the
 * document to the DocumentArray.
 *
 * @param {Object} mongooseDoc Mongoose document object to updpate
 * @param {Object} updateDataObj Plain object with properties-values to update; it should be the
 *            same structure of the mongoose document schema
 * @returns {*}
 */
module.exports.updateMongooseDoc = function (mongooseDoc, updateDataObj) {

	var self = this;

	// Updating the mongooseDoc data
	for (var uf in updateDataObj) {

		if (mongooseDoc[uf] instanceof mongooseTypes.DocumentArray) {

			updateDataObj[uf].forEach(function (val) {
				var sdoc;

				if (val._id !== undefined) {
					sdoc = mongooseDoc[uf].id(val._id);

					if (sdoc !== null) {
						// Update fields
						self.updateMongooseDoc(sdoc, val)


					} else {
						// Add new subdocument
						// If the subdocument doesn't exist the id of the new subdocument should not have
						// been sent, is it an attack?
						delete val._id;
						mongooseDoc[uf].push(val);
					}
				} else {
					// New subdocument
					sdoc = mongooseDoc[uf].create(val);
					mongooseDoc[uf].push(sdoc);
				}
			});
		} else {
			mongooseDoc[uf] = updateDataObj[uf];
		}
	}

	return mongooseDoc;

};

/**
 * Cast some of the special values' types defined in the provided MongoDB Object to their equivalent
 * javascript value.
 *
 * The supported typs are:
 *  $oid: ObjectId,
 *  $date: Date,
 *  $undefined: undefined
 *  $regex: RegExp
 *
 * @param {Object} mDBObj The object that contains some MondoDB value's types
 * @returns {Object} The same object with the casted values
 */
module.exports.mongoDBObjToJsObj = function (mDBObj) {

	var prop;

	for (prop in mDBObj) {

		switch (prop) {
			case '$date':
				return new Date(mDBObj.$date);

			case '$oid':
				return mongooseTypes.ObjectId.fromString(mDBObj.$oid);

			case '$undefined':
				return undefined;

			case '$regex':
				return new RegExp(mDBObj.$regex, mDBObj.$options);

			default:
				if (mDBObj[prop] instanceof Object) {
					mDBObj[prop] = this.mongoDBObjToJsObj(mDBObj[prop]);
				}
		}
	}

	return mDBObj;
};

var flatten = module.exports.flatten = function (obj, options) {

	var flattenArrays = false;
	var maxDeep = -1;
	var flattened = {};
	var p;
	var subObj;
	var sp;

	if (options) {
		flattenArrays = options.flattenArrays;

		if ('number' === typeof options.maxDeep) {
			maxDeep = options.maxDeep;
		}
	}

	for (p in obj) {
		if (((maxDeep < 0) || (maxDeep > 0))&& ('object' === typeof obj[p])) {

			if ((obj[p] instanceof Array) && (flattenArrays !== true)) {
					flattened[p] = obj[p];
			} else {


				subObj = flatten(obj[p], {
					maxDeep: maxDeep - 1,
					flattenArrays: flattenArrays
				});

				for (sp in subObj) {
					flattened[p + '.' + sp] = subObj[sp];
				}
			}
		} else {
			flattened[p] = obj[p];
		}
	}

	return flattened;
};


