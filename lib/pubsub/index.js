var _ = require('underscore');
var util = require('util');

var redis = require('../redis');
var RedisError = require('../redis/error');

const CHANNEL_SALT = 'SDC'; // [S]earch [D]estination [C]ache

/**
 * Constructor of a new ClientPubSub instance that can subscribe to channels and publish messages
 * Used three instances as Redis clients:
 *   - emitter
 *   - receiver for data
 *   - receiver for finish
 */
function ClientPubSub (options) {
  if (ClientPubSub.caller != ClientPubSub.getInstance) {
    throw new RedisError("Client PubSub object cannot be instanciated");
  }

  this._initClient(options);
}

/**
 * Enter point - get instance of client
 */
ClientPubSub.getInstance = function (options) {
  return new ClientPubSub(options);
};

ClientPubSub.prototype.end = function (channels) {
  if (_.isArray(channels) && !_.isEmpty(channels)) {
    _.each(channels, function (channel) {
      if (channel['onData']) {
        this._getReceiverData().unsubscribe(channel['onData']);
      }
      else if (channel['onFinish']) {
        this._getReceiverFinish().unsubscribe(channel['onFinish']);
      }
    }.bind(this));
  } else {
    // clean all subscribers
    this._getReceiverData().unsubscribe();
    this._getReceiverFinish().unsubscribe();
  }

  // close connection on emitter
  this._getEmitter().end();
  // close connection on `receiver for data`
  this._getReceiverData().end();
  // close connection on `receiver for finish`
  this._getReceiverFinish().end();
}

/**
 * Emit an event
 * @param {String} channel Channel on which to emit the message
 * @param {Object} message
 */
ClientPubSub.prototype.emit = function (channel, message) {
  this._getEmitter().publish(
    this._prepareChannelScope(channel),
    JSON.stringify(message)
  );
};

/**
 * Subscribe to a channel `data was received`
 * @param {String} channel The channel to subscribe to
 * @param {Function} handler Function to call with the received message.
 */
ClientPubSub.prototype.onData = function (channel, handler) {
  this._getReceiverData().on('message', function (channel, message) {
    handler(JSON.parse(message));
  }.bind(this));

  this._getReceiverData().subscribe(this._prepareChannelScope(channel));
};

/**
 * Subscribe to a channel `search process was finished`
 * @param {String} channel The channel to subscribe to
 * @param {Function} handler Function to call with the received message.
 */
ClientPubSub.prototype.onFinish = function (channel, handler) {
  this._getReceiverFinish().on('message', function (channel, message) {
    handler(JSON.parse(message));
  }.bind(this));

  this._getReceiverFinish().subscribe(this._prepareChannelScope(channel));
};

/**
 * Initialize clients to Redis.
 * Used three instances:
 *   - `emitter`
 *   - `receiver for data`
 *   - `receiver for finish`
 */
ClientPubSub.prototype._initClient = function (options) {
  // emitter
  {
    this._emitter = this._getClient(options);
  }

  // `receiver for data`
  {
    this._receiverData = this._getClient(options);
    this._receiverData.setMaxListeners(0);

    /*
    this._receiverData.on('subscribe', function (pattern, count) {
      //if (options.debug_mode) {
        console.log(util.format(
          'Receiver data subscribed to pattern \'%s\' with \'%s\' total subscriptions.',
          pattern,
          count
        ));
      //}
    }.bind(this));
    */

    /*
    this._receiverData.on('unsubscribe', function (pattern, count) {
      //if (options.debug_mode) {
        console.log(util.format(
          'Receiver data unsubscribed from pattern \'%s\' with \'%s\' total subscriptions.',
          pattern,
          count
        ));
      //}
    }.bind(this));
    */
  }

  // `receiver for finish`
  {
    this._receiverFinish = this._getClient(options);
    this._receiverFinish.setMaxListeners(0);

    /*
    this._receiverFinish.on('subscribe', function (pattern, count) {
      if (options.debug_mode) {
        console.log(util.format(
          'Receiver finish subscribed to pattern \'%s\' with \'%s\' total subscriptions.',
          pattern,
          count
        ));
      }
    }.bind(this));
    */

    /*
    this._receiverFinish.on('unsubscribe', function (pattern, count) {
      if (options.debug_mode) {
        console.log(util.format(
          'Receiver finish unsubscribed from pattern \'%s\' with \'%s\' total subscriptions.',
          pattern,
          count
        ));
      }
    }.bind(this));
    */
  }
}

ClientPubSub.prototype._prepareChannelScope = function (channelName) {
  channelName = _.isEmpty(channelName) ? '' : (channelName).toString();

  return util.format('%s:%s', CHANNEL_SALT, channelName);
}

ClientPubSub.prototype._getClient = function (options) {
  return redis.getInstance(options);
}

ClientPubSub.prototype._checkEmitter = function () {
  return _.isObject(this._emitter);
}

ClientPubSub.prototype._checkReceiverData = function () {
  return _.isObject(this._receiverData);
}

ClientPubSub.prototype._checkReceiverFinish = function () {
  return _.isObject(this._receiverFinish);
}

ClientPubSub.prototype._checkEmitterWithException = function () {
  if (!this._checkEmitter())
  {
    throw new RedisError('`Emitter` is not a valid');
  }

  return true;
}

ClientPubSub.prototype._checkReceiverDataWithException = function () {
  if (!this._checkReceiverData())
  {
    throw new RedisError('`Receiver for data` is not a valid');
  }

  return true;
}

ClientPubSub.prototype._checkReceiverFinishWithException = function () {
  if (!this._checkReceiverFinish())
  {
    throw new RedisError('`Receiver for finish` is not a valid');
  }

  return true;
}

ClientPubSub.prototype._getEmitter = function () {
  this._checkEmitterWithException();
  return this._emitter;
}

ClientPubSub.prototype._getReceiverData = function () {
  this._checkReceiverDataWithException();
  return this._receiverData;
}

ClientPubSub.prototype._getReceiverFinish = function () {
  this._checkReceiverFinishWithException();
  return this._receiverFinish;
}

module.exports = ClientPubSub;
