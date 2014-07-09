var redis = require('redis');
var _ = require('underscore');

var RedisError = require('./error');
var config = require('../../config');

function BaseClientWrapper () {}

BaseClientWrapper.prototype._useOptions = function (_options) {
  this.options = _.extend({}, config.get('redis')); 
  this.options = _.extend(this.options, _options); 
}

BaseClientWrapper.prototype._initClient = function () {
  this.client = new redis.createClient(
    this._getOptions().port,
    this._getOptions().host,
    this._getOptions()
  );

  if (this._getOptions().password) {
    this._getClient().auth(this._getOptions().password, function (error) {
      if (error) {
        throw new RedisError(error.message);
      }
    });
  }
}

BaseClientWrapper.prototype._checkOptions = function () {
  return _.isObject(this.options);
}

BaseClientWrapper.prototype._checkOptionsWithException = function () {
  if (!this._checkOptions())
  {
    throw new RedisError('Options are not valid for redis client');
  }

  return true;
}

BaseClientWrapper.prototype._getOptions = function () {
  this._checkOptionsWithException();

  return this.options;
}

BaseClientWrapper.prototype._checkClient = function () {
  return _.isObject(this.client);
}

BaseClientWrapper.prototype._checkClientWithException = function () {
  if (!this._checkClient())
  {
    throw new RedisError('Redis client is not valid');
  }

  return true;
}

BaseClientWrapper.prototype._getClient = function () {
  this._checkClientWithException();

  return this.client;
}

module.exports = BaseClientWrapper;
