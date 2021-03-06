var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./handler.json');

const STATE_BEGIN = 'begin';
const STATE_END = 'end';
const STATE_ERROR = 'error';

function Handler () {
  Base.call(this);
}

util.inherits(Handler, Base);

Handler.prototype.getNamespace = function () {
  return model.namespace;
};

Handler.prototype.prepareKey = function (key) {
  key = util.format('%s:%s', this.getNamespace(), key);
  key = Base.prototype.prepareKey.call(this, key); // call the same parent method

  return key;
};

Handler.prototype.checkState = function (key, callback) {
  this._getClient().hget(
    this.prepareKey(key),
    model.state.field,
    this._useCallbackForCheckStatus(callback)
  );
};

Handler.prototype._useCallbackForCheckStatus = function (callback) {
  return function (error, state) {
    if (!_.isFunction(callback)) {
      return;
    }

    if (error) {
      callback(error);
    }
    else {
      state = this._isValidState(state)
        ? (state).toString().toLowerCase()
        : '';
      callback(null, state);
    }
  }.bind(this);
}

Handler.prototype.checkCounter = function (key, callback) {
  this._getClient().hget(
    this.prepareKey(key),
    model.counter.field,
    this._useCallbackForCheckCounter(callback)
  );
};

Handler.prototype._useCallbackForCheckCounter = function (callback) {
  return function (error, count) {
    if (!_.isFunction(callback)) {
      callback(false);
    }

    if (error) {
      callback(false);
    } else {
      count = this._isValidCount(count)
        ? parseInt((count).toString())
        : 0;

      callback((count > 1));
    }
  }.bind(this);
}

Handler.prototype.begin = function (key, requestData, callback) {
  if (_.isEmpty(requestData)) {
    requestData = '';
  } else if (_.isObject(requestData)) {
    requestData = JSON.stringify(requestData);
  } else {
    requestData = (requestData).toString();
  }

  this._getClient().hmset(
    this.prepareKey(key),
    model.counter.field,
    model.counter.start,
    model.state.field,
    STATE_BEGIN,
    model.request.field,
    requestData,
    model.time_begin.field,
    this._time(),
    this._useCallbackForModify(callback)
  );
};

Handler.prototype.finish = function (key, callback) {
  this._getClient().hmset(
    this.prepareKey(key),
    model.state.field,
    STATE_END,
    model.time_end.field,
    this._time(),
    this._useCallbackForModify(callback)
  );
};

Handler.prototype.incr = function (key, callback) {
  this._getClient().hincrby(
    this.prepareKey(key),
    model.counter.field,
    model.counter.step,
    this._useCallbackForModify(callback)
  );
};


Handler.prototype.error = function (key, message, callback) {
  if (_.isEmpty(message)) {
    message = '';
  } else if (_.isObject(message)) {
    message = JSON.stringify(message);
  } else {
    message = (message).toString();
  }

  this._getClient().hmset(
    this.prepareKey(key),
    model.state.field,
    STATE_ERROR,
    model.time_error.field,
    this._time(),
    model.error_message.field,
    message,
    this._useCallbackForModify(callback)
  );
};

Handler.prototype._isValidState = function (state) {
  return (!_.isEmpty(state) && (_.indexOf(model.state.values, state) != -1))
};

Handler.prototype._isValidCount = function (count) {
  return (!_.isEmpty(count) && parseInt((count).toString()) > 0);
};

module.exports = Handler;
