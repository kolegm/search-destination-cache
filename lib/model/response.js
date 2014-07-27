var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./response.json');

function Response () {
  Base.call(this);
}

util.inherits(Response, Base);

Response.prototype.prepareKey = function (key) {
  key = util.format('%s:%s', model.namespace, key);
  return Base.prototype.prepareKey.call(this, key); // call the same parent method
};

Response.prototype.set = function (key, data, callback) {
  if (_.isEmpty(data)) {
    data = '';
  } else if (_.isObject(data)) {
    data = JSON.stringify(data);
  } else {
    data = (data).toString();
  }

  this._getClient().rpush(
    this.prepareKey(key),
    data,
    this._useCallbackForModify(callback)
  );
};

Response.prototype.get = function (key, callback) {
  this._getClient().lrange(
    this.prepareKey(key),
    0, // from first
    -1, // to end, all elements in a list
    this._useCallbackForSelect(callback)
  );
};

Response.prototype._useCallbackForSelect = function (callback) {
  return function (error, data) {
    if (!_.isFunction(callback)) {
      return;
    }

    if (error) callback(error);
    else callback(null, data);
  };
};

module.exports = new Response();
