var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./handler.json');

const STATE_BEGIN = 'begin';
const STATE_PROGRESS = 'progress';
const STATE_END = 'end';
const STATE_ERROR = 'error';

function Handler () {
  Base.call(this);
}

util.inherits(Handler, Base);

Handler.prototype.prepareKey = function (key) {
  key = util.format('%s:%s', model.namespace, key);
  return Base.prototype.prepareKey.call(this, key); // call the same parent method
};

Handler.prototype.checkState = function (key, callback) {
  var self = this;
  this._client.hget(
    this.prepareKey(key),
    model.state.field,
    function (error, state) {
      if (error) {
        callback(error);
      }
      else {
        state = self._isValidState(state)
          ? (state).toString().toLowerCase()
          : '';
        
        callback(null, state);
      }
    }
  );
};

Handler.prototype.begin = function (key, requestData, callback) {
  if (_.isEmpty(requestData)) {
    requestData = '';
  } else if (_.isObject(requestData)) {
    requestData = JSON.stringify(requestData);
  } else {
    requestData = (requestData).toString();
  }

  this._client.hmset([
      this.prepareKey(key),
      model.state.field,
      STATE_BEGIN,
      model.request.field,
      requestData,
      model.time_begin.field,
      this._time()
    ],
    this._useCallback(callback)
  );
};

Handler.prototype.progress = function (key, callback) {
  this._client.hset([
      this.prepareKey(key),
      model.state.field,
      STATE_PROGRESS
    ],
    this._useCallback(callback)
  );
};

Handler.prototype.end = function (key, callback) {
  this._client.hmset([
      this.prepareKey(key),
      model.state.field,
      STATE_END,
      model.time_end.field,
      this._time()
    ],
    this._useCallback(callback)
  );
};

Handler.prototype.error = function (key, message, callback) {
  message = _.isEmpty(message) ? '' : (message).toString();
  this._client.hmset([
      this.prepareKey(key),
      model.state.field,
      STATE_ERROR,
      model.time_error.field,
      this._time(),
      model.error_message.field,
      message
    ],
    this._useCallback(callback)
  );
};

Handler.prototype._isValidState = function (state) {
  return (!_.isEmpty(state) && (_.indexOf(model.state.values, state) != -1))
};

module.exports = new Handler();
