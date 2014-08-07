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

KeyEventClient.prototype.onExpire = function (handler) {
  this._getReceiver().on('message', function (channel, message) {
    if (_.isFunction(handler)) {
      handler(channel, message);
    }
  }.bind(this));

  this._getReceiver().subscribe(this.getKey());
};

KeyEventClient.prototype.getKey = function () {
  var dbIndex = process.env.REDIS_DB_INDEX_SD || 0; // database index for search destination
  var key = util.format(
    KEY_EVENT_NS,
    dbIndex,
    KEY_EVENT_EXPIRED
  );
  
  return key;
}

/**
 * Initialize KeyEventClient to Redis.
 */
KeyEventClient.prototype._initClient = function (options) {
  this.receiver = this._getClient(options);
  this.receiver.setMaxListeners(0);

  /**
   * Redis can notify Pub/Sub clients about events happening in the key space.
   * This feature is documented at http://redis.io/topics/keyspace-events
   * The "notify-keyspace-events" takes as argument a string that is composed
   * by zero or multiple characters. The empty string means that notifications
   * are disabled at all.
   *
   * It is possible to select the events that Redis will notify among a set
   * of classes. Every class is identified by a single character:
   * K  Keyspace events, published with __keyspace@<db>__ prefix.
   * E  Keyevent events, published with __keyevent@<db>__ prefix.
   * g  Generic commands (non-type specific) like DEL, EXPIRE, RENAME, ...
   * $  String commands
   * l  List commands
   * s  Set commands
   * h  Hash commands
   * z  Sorted set commands
   * x  Expired events (events generated every time a key expires)
   * e  Evicted events (events generated when a key is evicted for maxmemory)
   * A  Alias for g$lshzxe, so that the "AKE" string means all the events.
   */
  this.receiver.config('set', 'notify-keyspace-events', 'Ex');
};

KeyEventClient.prototype.end = function () {
  this._getReceiver().unsubscribe(this.getKey());
  this._getReceiver().end();
}
  
KeyEventClient.prototype._getClient = function (options) {
  return redis.getInstance(options);
};

KeyEventClient.prototype._checkReceiver = function () {
  return _.isObject(this.receiver);
};

KeyEventClient.prototype._checkReceiverWithException = function () {
  if (!this._checkReceiver())
  {
    throw new RedisError('Receiver is not a valid');
  }

  return true;
};

KeyEventClient.prototype._getReceiver = function () {
  this._checkReceiverWithException();
  return this.receiver;
};

module.exports = KeyEventClient;
