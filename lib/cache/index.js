var Register = require('../model/register');
var Handler = require('../model/handler');
var Response = require('../model/response');

function Cache () {
  this._init();
}

Cache.prototype._init = function () {
  this.register = new Register();
  this.handler = new Handler();
  this.response = new Response();
};

Cache.prototype.end = function () {
  this.register.end();
  this.handler.end();
  this.response.end();
};

Cache.prototype.checkRelevance = function (key, callback) {
  this.handler.checkCounter(key, callback);
};

Cache.prototype.checkState = function (key, callback) {
  this.handler.checkState(key, callback);
};

Cache.prototype.start = function (key, query, callback) {
  this.handler.begin(key, query, callback);
  this.register.set(key);
};

Cache.prototype.finish = function (key) {
  this.handler.finish(key);
};

Cache.prototype.getData = function (key, callback) {
  this.response.get(key, callback);
  this.handler.incr(key);
};

Cache.prototype.setData = function (key, data) {
  this.response.set(key, data);
};

Cache.prototype.error = function (key, message) {
  this.handler.error(key, message);
};

Cache.prototype.purge = function (key) {
  this.handler.purge(key);
  this.response.purge(key);
};

Cache.prototype.getNamespace = function () {
  return this.register.getNamespace();
};

module.exports = Cache;
