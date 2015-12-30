module.exports = exports;

var iWazat = require('./iWazat');

function ServerApp(msg, dataObj) {
  this.type = 'Server Application';

  iWazat.call(this, {
    message : msg,
    code : 500
  }, dataObj);
}

ServerApp.prototype.__proto__ = iWazat.prototype;

module.exports = ServerApp;