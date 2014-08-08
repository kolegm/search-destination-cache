var _ = require('underscore');
var util = require('util');

var KeyEventClient = require('../pubsub/keyEvent');

function Updater () {}

Updater.prototype.activate = function (callback) {
  this._getKeyEventer().onExpire(callback);
}

Updater.prototype.deactivate = function () {
  this._getKeyEventer().end();
}

Updater.prototype._getKeyEventer = function () {
  if (!_.isObject(this.keyEventer)) {
    this._keyEventer = KeyEventClient.getInstance();
  }

  return this._keyEventer;
}

module.exports = Updater;
