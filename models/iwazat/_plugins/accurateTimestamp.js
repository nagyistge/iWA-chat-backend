/*
 * ! Mongoose Accurate Timestamps Plugin Copyright(c) 2013 Ivan Fraixedes <ivan@fraicu.com> Original
 * work Copyright(c) 2012 Nicholas Penree <nick@penree.com> MIT Licensed
 */

/**
 * 
 * @param {Object} schema the instance of the Mongoose Schema to attach the new functionalities
 * @param {Object} [options] The expected values are:
 * 
 *  # [createdAttPath] The complete path to store the document's creation date
 *  
 *  # [updatedAttPath] The complete path to store the document's updating date
 */
function accurateTimestampPlugin(schema, options) {

  var createdAttPath = 'created_at';
  var updatedAttPath = 'updated_at';

  if (options) {
    if (options.createAttName) {
      createdAttPath = options.createdAttPath;
    }

    if (options.updatedAttPath){
      updatedAttPath = options.updatedAttPath;
    }
  }
  
  
  schema.path(createdAttPath, {
    type: Date,
    'default': Date.now
  });  
  schema.path(updatedAttPath, Date);

  
  schema.pre('save', function(next) {
    this[updatedAttPath] = new Date;
    next();
  });

}

module.exports = accurateTimestampPlugin;