var redis = require('redis');
var _ = require('underscore');

var RedisError = require('./error');

function Wrapper (_options) {
  this._useOptions(_options);
  this._initClient();
}

Wrapper.prototype._useOptions = function (_options) {
  this.options = _.extend({}, _options); 
}

Wrapper.prototype._initClient = function () {
  var port = process.env.REDIS_PORT;
  var host = process.env.REDIS_HOST;
  var dbIndex = process.env.REDIS_DB_INDEX_SD; // database index for search destination
  var password = process.env.REDIS_PASSWORD;
  var debug = Boolean(process.env.REDIS_DEBUG);

  try {
    this.client = new redis.createClient(port, host, this._getOptions());
    
    this.client.on('error', function (error) {
      throw new RedisError(error.message);
    });

    if (debug) {
      this._getClient().debug_mode = true;
    }

    if (password) {
      this._getClient().auth(password, function (error) {
        if (error) {
          throw new RedisError(error.message);
        }
      });
    }

    if (dbIndex) {
      this._getClient().select(dbIndex, function (error) {
        if (error) {
          throw new RedisError(error.message);
        }
      });
    }
  } catch (error) {
    throw new RedisError('Initialization failed Redis client. ' + error.message);
  }
}

Wrapper.prototype._checkOptions = function () {
  return _.isObject(this.options);
}

Wrapper.prototype._checkOptionsWithException = function () {
  if (!this._checkOptions())
  {
    throw new Error('Options are not valid.');
  }

  return true;
}

Wrapper.prototype._getOptions = function () {
  this._checkOptionsWithException();

  return _.extend({}, this.options);
}

Wrapper.prototype._checkClient = function () {
  return _.isObject(this.client);
}

Wrapper.prototype._checkClientWithException = function () {
  if (!this._checkClient())
  {
    throw new Error('Client is not a valid');
  }

  return true;
}

Wrapper.prototype._getClient = function () {
  this._checkClientWithException();

  return this.client;
}

module.exports = function (options) {
  return (new Wrapper(options))._getClient();
};
