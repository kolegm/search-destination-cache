var _ = require('underscore');

var redis = require('./client');

const KEY_CLIENT_EMITTER = 'emitter';
const KEY_CLIENT_RECEIVER = 'receiver';

function ClientPubSub (options) {
  if (ClientPubSub.caller != ClientPubSub.getInstance) {
    throw new Error("Client PubSub object cannot be instanciated");
  }
  
  this._initClient(options);
}

ClientPubSub.prototype.end = function () {
  this._getEmitter().end();
  this._getReceiver().end();
}

ClientPubSub.prototype._initClient = function (options) {
  this.emitter = this._getClientByKey(KEY_CLIENT_EMITTER, options);
  this.receiver = this._getClientByKey(KEY_CLIENT_RECEIVER, options);
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
    throw new Error('Emitter is not a valid');
  }

  return true;
}

ClientPubSub.prototype._checkReceiverWithException = function () {
  if (!this._checkReceiver())
  {
    throw new Error('Receiver is not a valid');
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