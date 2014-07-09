var _ = require('underscore');
var util = require('util');

var BaseClientWrapper = require('./client');
var RedisError = require('./error');

var noop = function () {};

function ClientWrapper (_options) {
  BaseClientWrapper.call(this);
  this._useOptions(_options);
  this._initClient();
}

util.inherits(ClientWrapper, BaseClientWrapper);

ClientWrapper.prototype.quit = function () {
  this._getClient().quit();
};

ClientWrapper.prototype.get = function (key, fn) {
  fn = fn || noop;

  this.client.get(key, function (err, data) {
    if (err) return fn(err);
    if (!data) return fn(null, null);

    data = data.toString();

    try {
      fn(null, JSON.parse(data));
    } catch (e) {
      fn(e);
    }
  });
};

ClientWrapper.prototype.set = function set(key, val, ttl, fn) {
  if ('function' === typeof ttl) {
    fn = ttl;
    ttl = null;
  }

  fn = fn || noop;

  try {
    val = JSON.stringify(val)
  } catch (e) {
    return fn(e);
  }

  if (-1 === ttl) {
    this.client.set(key, val, cb);
  } else {
    this.client.setex(key, (ttl || 60), val, cb);
  }

  function cb(err) {
    if (err) return fn(err);
    fn(null, val);
  }

};

ClientWrapper.prototype.del = function del(key, fn) {
  fn = fn || noop;
  this.client.del(key, fn);
};

ClientWrapper.prototype.clear = function clear(key, fn) {
  var store = this;

  if ('function' === typeof key) {
    fn = key;
    key = '';
  }

  fn = fn || noop;

  store.client.keys(key + '*', function keys(err, data) {
    if (err) return fn(err);
    var count = data.length;

    data.forEach(function each(key) {
      store.del(key, function del(err, data) {
        if (err) {
          count = 0;
          return fn(err);
        }
        if (--count == 0) {
          fn(null, null);
        }
      });
    });
  });
};

module.exports = ClientWrapper;
