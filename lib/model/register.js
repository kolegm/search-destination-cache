var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./register.json');

function Register () {
  Base.call(this);
}

util.inherits(Register, Base);

Register.prototype.prepareKey = function (key) {
  return Base.prototype.prepareKey.call(this, key); // call the same parent method
};

Register.prototype.set = function (key, callback) {
  this._getClient().set(
    this.prepareKey(key),
    model.flag,
    'ex',
    model.expiration,
    this._useCallbackForModify(callback)
  );
};

Register.prototype._useCallbackForSelect = function (callback) {
  return function (error, data) {
    if (!_.isFunction(callback)) {
      return;
    }

    if (error) callback(error);
    else callback(null, data);
  };
};

module.exports = Register;
