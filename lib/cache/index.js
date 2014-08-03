var Handler = require('../model/handler');
var Response = require('../model/response');

function Cache () {
  this._init();
}

Cache.prototype._init = function () {
  this.handler = new Handler();
  this.response = new Response();
};

Cache.prototype.end = function () {
  this.handler.end();
  this.response.end();
}

Cache.prototype.check = function (key, callback) {
  this.handler.checkState(key, callback);
}

Cache.prototype.start = function (key, query, callback) {
  this.handler.begin(key, query, callback);
}

Cache.prototype.finish = function (key) {
  this.handler.finish(key);
}

Cache.prototype.getData = function (key, callback) {
  this.response.get(key, callback);
  this.handler.incr(key);
}

Cache.prototype.setData = function (key, data) {
  this.response.set(key, data);
}

Cache.prototype.expire = function (key, time) {
  this.handler.expire(key, time);
}

Cache.prototype.error = function (key, message) {
  this.handler.error(key, message);
}

module.exports = Cache;