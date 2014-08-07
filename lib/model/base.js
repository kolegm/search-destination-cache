var crypto = require('crypto');
var _ = require('underscore');

var RedisClient = require('../redis');

function Base () {
  this._getClient();
}

Base.prototype._getClient = function () {
  if (!_.isObject(this._client)) {
    this._client = RedisClient.getInstance({
      //debug_mode: true
    });
  }
  return this._client;
}

Base.prototype.purge = function (key) {
  this._getClient().del(this.prepareKey(key));
};

Base.prototype.end = function () {
  this._getClient().end();
}

/**
 * Prepare key as a hash of input value
 * @access public
 */
Base.prototype.prepareKey = function (key) {
  return key;
};

Base.prototype._time = function () {
    return +(new Date()); // as timestamp
};

Base.prototype._useCallbackForModify = function (callback) {
  return function (error, reply) {
    if (!_.isFunction(callback)) {
      return;
    }
    if (error) callback(error);
    else callback(null, (reply == SUCCESS));
  };
};

module.exports = Base;
