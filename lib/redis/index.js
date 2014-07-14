/**
 * Client for work with redis as singleton
 *
 * Using:
 *  require('./').getInstance({
 *    // specify redis options here
 *  });
 */

var redis = require('redis');
var _ = require('underscore');

var RedisError = require('./error');

/**
 * Constructor - create a singleton for work with redis
 */
function Client (_options) {
  if (Client.caller != Client.getInstance){
    throw new Error("This object cannot be instanciated");
  }
  
  this._useOptions(_options);
  this._initClient();
}

Client.prototype._useOptions = function (_options) {
  this.options = _.extend({}, _options); 
};

Client.prototype._initClient = function () {
  var port = process.env.REDIS_PORT;
  var host = process.env.REDIS_HOST;
  var dbIndex = process.env.REDIS_DB_INDEX_SD; // database index for search destination
  var password = process.env.REDIS_PASSWORD;
  var debug = Boolean(process.env.REDIS_DEBUG);

  try {
    this.client = new redis.createClient(port, host, this._getOptions());
    
    this._getClient().on('error', function (error) {
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

Client.prototype._checkOptions = function () {
  return _.isObject(this.options);
}

Client.prototype._checkOptionsWithException = function () {
  if (!this._checkOptions())
  {
    throw new Error('Options are not valid.');
  }

  return true;
}

Client.prototype._getOptions = function () {
  this._checkOptionsWithException();

  return _.extend({}, this.options);
}

Client.prototype._checkClient = function () {
  return _.isObject(this.client);
}

Client.prototype._checkClientWithException = function () {
  if (!this._checkClient())
  {
    throw new Error('Client is not a valid');
  }

  return true;
}

Client.prototype._getClient = function () {
  this._checkClientWithException();
  return this.client;
}

/**
 * Get singleton instance for redis client
 */
Client.instance = null;
Client.getInstance = function (options) {
  if (!(this.instance instanceof Client)) {
    this.instance = new Client(options);
  }
  return this.instance._getClient();
};

module.exports = Client;
