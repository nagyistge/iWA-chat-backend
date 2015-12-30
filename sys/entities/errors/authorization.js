module.exports = exports;

var iWazat = require('./iWazat');

function Authorization(msgOrObj, dataObj) {
  this.type = 'Authorization';
  var errInfoObj;

  if ('string' === typeof msgOrObj) {
    errInfoObj = {
      code: 403,
      message: msgOrObj
    };
  } else {
    errInfoObj = msgOrObj;
    errInfoObj.code = 403;
  }

  iWazat.call(this, errInfoObj, dataObj);
}

Authorization.prototype.__proto__ = iWazat.prototype;

module.exports = Authorization;