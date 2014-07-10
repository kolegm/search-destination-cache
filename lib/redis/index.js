var _ = require('underscore');
var util = require('util');

var BaseClientHandler = require('./base');
var RedisError = require('./error');

function ClientHandler (_options) {
  BaseClientHandler.call(this);
  this._useOptions(_options);
  this._initClient();
}

util.inherits(ClientHandler, BaseClientHandler);

ClientHandler.prototype.quit = function () {
  this._getClient().quit();
};

ClientHandler.prototype.exp = function (key, ttl) {
  key = (key).toString();
  ttl = parseInt(ttl);

  if (!isNaN(ttl)) {
    this._getClient().expire(key, ttl);
  }
}

ClientHandler.prototype.hmsetex = function (key, obj, ttl, callback) {
  this._getClient().hmset(key, obj, callback); 
  this.exp(key, ttl);  
};

ClientHandler.prototype.hmsetenx = function (key, obj, ttl, callback) {
  this._getClient().hmsetnx(key, obj, callback); 
  this.exp(key, ttl);  
};

ClientHandler.prototype.hgetall = function (key, callback) {
  this._getClient().hgetall(key, callback); 
}

module.exports = ClientHandler;
