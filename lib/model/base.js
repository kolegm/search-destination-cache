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

/**
 * Prepare key as a hash of input value
 * @access public
 */
Base.prototype.prepareKey = function (key) { 
  return crypto
    .createHash('md5')
    .update(key)
    .digest('hex');
};

Base.prototype._time = function () {
    return +(new Date()); // as timestamp
};

Base.prototype._useCallback = function (callback) {
  return function (error, reply) {
    if (_.isFunction(callback)) {
      if (error) callback(error);
      else callback(null, (reply == SUCCESS));
    }
  };
};

module.exports = Base;
