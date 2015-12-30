module.exports = exports;

var iWazat = require('./iWazat');

function HttpRequest(msgOrObj, resCode, reqObj) {
  this.type = 'HTTP Request';

  var errInfoObj;

  if ('string' === typeof msgOrObj) {
    errInfoObj = {
      code: resCode,
      message: msgOrObj
    };
  } else {
    errInfoObj = msgOrObj;
    errInfoObj.code = resCode;
  }

  iWazat.call(this, errInfoObj, reqObj);
}

HttpRequest.prototype.__proto__ = iWazat.prototype;

module.exports = HttpRequest;