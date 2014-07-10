var redis = require('redis');
var _ = require('underscore');

var RedisError = require('./error');
var config = require('../../config');

function BaseClientHandler () {}

BaseClientHandler.prototype._useOptions = function (_options) {
  this.options = _.extend({}, config.get('redis')); 
  this.options = _.extend(this.options, _options); 
}

BaseClientHandler.prototype._initClient = function () {
  this.client = new redis.createClient(
    this._getOptions().port,
    this._getOptions().host,
    this._getOptions()
  );
  
  if (this._getOptions().debug) {
    this._getClient().debug_mode = true;
  }

  if (this._getOptions().password) {
    this._getClient().auth(this._getOptions().password, function (error) {
      if (error) {
        throw new RedisError(error.message);
      }
    });
  }
  
  if (this._getOptions().db_index) {
    this._getClient().select(this._getOptions().db_index, function (error) {
      if (error) {
        throw new RedisError(error.message);
      }
    });
  }

}

BaseClientHandler.prototype._checkOptions = function () {
  return _.isObject(this.options);
}

BaseClientHandler.prototype._checkOptionsWithException = function () {
  if (!this._checkOptions())
  {
    throw new RedisError('Options are not valid for redis client');
  }

  return true;
}

BaseClientHandler.prototype._getOptions = function () {
  this._checkOptionsWithException();

  return _.extend({}, this.options);
}

BaseClientHandler.prototype._checkClient = function () {
  return _.isObject(this.client);
}

BaseClientHandler.prototype._checkClientWithException = function () {
  if (!this._checkClient())
  {
    throw new RedisError('Redis client is not valid');
  }

  return true;
}

BaseClientHandler.prototype._getClient = function () {
  this._checkClientWithException();

  return this.client;
}

module.exports = BaseClientHandler;
