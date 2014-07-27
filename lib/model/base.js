const SUCCESS = 'OK';

var crypto = require('crypto');
var _ = require('underscore');

var redisClient = require('../redis').getInstance(null, {
  // options
  //debug_mode: true
});

function Base () {
  this._client = redisClient;
}

Base.prototype._getClient = function () {
  return this._client;
}

/**
 * Prepare key as a hash of input value
 * @access public
 */
Base.prototype.prepareKey = function (key) {
  // key = crypto
  //   .createHash('md5')
  //   .update(key)
  //   .digest('hex');

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
