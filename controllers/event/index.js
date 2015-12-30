
/** Event controller **/

module.exports = exports;

/**
 * Export all the actions that the controller implements
 */
module.exports.actions = {
  publicHome: require('./actions/publicHome'),
  publicInfo: require('./actions/publicInfo'),
  authorisedInfo: require('./actions/authorisedInfo'),
  authorisationStatus: require('./actions/authorisationStatus'),
  getTimelineMessages: require('./actions/getTimelineMessages'),
  threeInvolvedQ: require('./actions/threeInvolvedQ'),
  participantsRanking: require('./actions/participantsRanking'),
  checkNewSlug: require('./actions/checkNewSlug'),
  newEvent: require('./actions/newEvent'),
  switchOnTimelineStream: require('./actions/switchOnTimelineStream'),
  switchOffTimelineStream: require('./actions/switchOffTimelineStream'),
	updateEvent: require('./actions/updateEvent')
};



/**
 * Export all the middlewares that the controller implements
 */
module.exports.middlewares = {
  pre: {
    authorization: require('./middlewares/pre/authorization'),
    authAccessChecker: require('./middlewares/pre/authAccessChecker'),
    authManagerChecker: require('./middlewares/pre/authManagerChecker'),
    parseUrlParams: require('./middlewares/pre/parseUrlParams'),
    parseTimelineQuery: require('./middlewares/pre/parseTimelineQuery'),
    filterEventData: require('./middlewares/pre/filterEventData'),
    setCurrentTimelineCol: require('./middlewares/pre/setCurrentTimelineCol'),
    parseSpecAccessRight: require('./middlewares/pre/parseSpecAccessRight'),
	  getReferenceInfo: require('./middlewares/pre/getReferenceInfo'),
	  filterEventUpdatableData: require('./middlewares/pre/filterEventUpdatableData')
  }
//  post: {
//  }
};
