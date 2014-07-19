var _ = require('underscore');
var util = require('util');

var redis = require('../redis');
var RedisError = require('../redis/error');

const KEY_CLIENT_EMITTER = 'emitter';
const KEY_CLIENT_RECEIVER = 'receiver';

/**
 * Constructor of a new ClientPubSub instance that can subscribe to channels and publish messages
 */
function ClientPubSub (options) {
  if (ClientPubSub.caller != ClientPubSub.getInstance) {
    throw new RedisError("Client PubSub object cannot be instanciated");
  }
  
  this._initClient(options);
  
  this.channelSalt = 'SDC'; // [S]earch [D]estination [C]ache
}

ClientPubSub.prototype.end = function () {
  this._getEmitter().end();
  this._getReceiver().end();
}

/**
* Subscribe to a channel
* @param {String} channel The channel to subscribe to
* @param {Function} handler Function to call with the received message.
* @param {Function} callback Optional callback to call once the handler is registered.
*
*/
ClientPubSub.prototype.on = function (channel, handler, callback) {
  var self = this;
  this._getReceiver().on('message', function (_channel, message) {
    console.log(util.format('On channel \'%s\' received a message: \'%s\' ', _channel, message));

    handler(JSON.parse(message));

    self._getReceiver().unsubscribe(_channel, function () {
      // todo 
    });
  });

  this._getReceiver().on('subscribe', function (pattern, count) {
    console.log(util.format('Receiver subscribed to pattern \'%s\' with \'%s\' total subscriptions.', pattern, count));
  });

  this._getReceiver().on("unsubscribe", function (pattern, count) {
    console.log(util.format('Receiver unsubscribed from pattern \'%s\' with \'%s\' total subscriptions.', pattern, count));
  });

  this._getReceiver().subscribe(
    this._prepareChannelScope(channel),
    callback
  );
};


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

ClientPubSub.prototype._prepareChannelScope = function (channelName) {
  channelName = _.isEmpty(channelName) ? '' : (channelName).toString();

  return util.format('%s:%s', this.channelSalt, channelName);
}

ClientPubSub.prototype._initClient = function (options) {
  this.emitter = this._getClientByKey(KEY_CLIENT_EMITTER, options);

  this.receiver = this._getClientByKey(KEY_CLIENT_RECEIVER, options);
  this.receiver.setMaxListeners(0);
}

ClientPubSub.prototype._getClientByKey = function (key, options) {
  return redis.getInstance(key, options);
}

ClientPubSub.prototype._checkEmitter = function () {
  return _.isObject(this.emitter);
}

ClientPubSub.prototype._checkReceiver = function () {
  return _.isObject(this.receiver);
}

ClientPubSub.prototype._checkEmitterWithException = function () {
  if (!this._checkEmitter())
  {
    throw new RedisError('Emitter is not a valid');
  }

  return true;
}

ClientPubSub.prototype._checkReceiverWithException = function () {
  if (!this._checkReceiver())
  {
    throw new RedisError('Receiver is not a valid');
  }

  return true;
}

ClientPubSub.prototype._getEmitter = function () {
  this._checkEmitterWithException();
  return this.emitter;
}

ClientPubSub.prototype._getReceiver = function () {
  this._checkReceiverWithException();
  return this.receiver;
}

/**
 * Get singleton instance for PubSub redis client
 */
ClientPubSub.instance = null;
ClientPubSub.getInstance = function (options) {
  if (!(this.instance instanceof ClientPubSub)) {
    this.instance = new ClientPubSub(options);
  }
  
  return this.instance;
};

module.exports = ClientPubSub;
