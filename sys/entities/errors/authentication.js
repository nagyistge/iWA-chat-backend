module.exports = exports;

var iWazat = require('./iWazat');

function Authentication(msgOrObj, iWazatErrCode, dataObj) {
	this.type = 'Authentication';
	var errInfoObj;

		errInfoObj = msgOrObj;

		if ('number' !== typeof errInfoObj.code) {
			if ('number' == typeof iWazatErrCode) {
				errInfoObj.code = iWazatErrCode;
			} else {
				errInfoObj.code = 401;
			}
		}


	iWazat.call(this, errInfoObj, dataObj);
}

Authentication.prototype.__proto__ = iWazat.prototype;

module.exports = Authentication;
