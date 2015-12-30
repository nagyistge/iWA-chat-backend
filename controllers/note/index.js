/** Note controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
  newNote: require('./actions/newNote'),
  getNotes: require('./actions/getNotes')
};


/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
  pre: {
    parseNoteData: require('./middlewares/pre/parseNoteData'),
    createQueryUserNotes: require('./middlewares/pre/createQueryUserNotes')
  }
};
