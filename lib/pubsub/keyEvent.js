var _ = require('underscore');
var util = require('util');

var redis = require('../redis');
var RedisError = require('../redis/error');

const KEY_EVENT_NS = '__keyevent@%s__:%s';
const KEY_EVENT_EXPIRED = 'expired';

/**
 * Constructor of a new KeyEventClient instance that can subscribe to channels and publish messages
 */
function KeyEventClient (options) {
  if (KeyEventClient.caller != KeyEventClient.getInstance) {
    throw new RedisError("Client KeyEvent object cannot be instanciated");
  }

  this._initClient(options);
}

/**
 * Enter point - get instance of client
 */
KeyEventClient.getInstance = function (options) {
  return new KeyEventClient(options);
};

KeyEventClient.prototype.end = function () {
  // clean all subscribers
  this._getReceiver().unsubscribe();
  this._getReceiver().end();
}

KeyEventClient.prototype.onExpire = function (handler) {
  this._getReceiver().on('message', function (channel, message) {
    if (_.isFunction(handler)) {
      handler(channel, message);
    }
  }.bind(this));

  this._getReceiver().subscribe(util.format(
    KEY_EVENT_NS,
    0,
    KEY_EVENT_EXPIRED
  ));
};

/**
 * Initialize KeyEventClient to Redis.
 */
KeyEventClient.prototype._initClient = function (options) {
  this.receiver = this._getClient(options);
  this.receiver.setMaxListeners(0);
  this.receiver.config('set', 'notify-keyspace-events', 'Ex');
}

KeyEventClient.prototype._getClient = function (options) {
  return redis.getInstance(options);
}

KeyEventClient.prototype._checkReceiver = function () {
  return _.isObject(this.receiver);
}

KeyEventClient.prototype._checkReceiverWithException = function () {
  if (!this._checkReceiver())
  {
    throw new RedisError('Receiver is not a valid');
  }

  return true;
}

KeyEventClient.prototype._getReceiver = function () {
  this._checkReceiverWithException();
  return this.receiver;
}

module.exports = KeyEventClient;
