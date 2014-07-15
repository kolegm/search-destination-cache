var _ = require('underscore');
var util = require('util');
var crypto = require('crypto');

var model = require('./handler.json');
var redisClient = require('../redis').getInstance({
  // options
  //debug_mode: true
});

const STATE_BEGIN = 'begin';
const STATE_PROGRESS = 'progress';
const STATE_END = 'end';
const STATE_ERROR = 'error';

const SUCCESS = 'OK';

var handler = {
  /**
   * Public methods
   */
  prepareKey: function (key) { // prepare key as a hash of input value
    key = util.format('%s:%s', model.namespace, key);
    key = crypto
      .createHash('md5')
      .update(key)
      .digest('hex');

    return key;
  },
  checkState: function (key, callback) {
    this._client.hget(
      this.prepareKey(key),
      model.state.field,
      function (error, state) {
        if (error) callback(error);
        else {
          if (_.isEmpty(state)
              || (_.indexOf(model.state.values, state) == -1))
          {
            state = '';
          }
          else {
            state = (state).toString().toLowerCase();
          }
          
          callback(null, state);
        }
      });
  },
  begin: function (key, callback) {
    this._client.hmset([
        this.prepareKey(key),
        model.state.field,
        STATE_BEGIN,
        model.time_begin.field,
        this._time()
      ],
      this._callbackOnChange(callback)
    );
  },
  progress: function (key, callback) {
    this._client.hset([
        this.prepareKey(key),
        model.state.field,
        STATE_PROGRESS
      ],
      this._callbackOnChange(callback)
    );
  },
  end: function (key, callback) {
    this._client.hmset([
        this.prepareKey(key),
        model.state.field,
        STATE_END,
        model.time_end.field,
        this._time()
      ],
      this._callbackOnChange(callback)
    );
  },
  error: function (key, callback) {
    this._client.hmset([
        this.prepareKey(key),
        model.state.field,
        STATE_ERROR,
        model.time_error.field,
        this._time()
      ],
      this._callbackOnChange(callback)
    );
  },

  /**
   * Protected methods
   */
  _client: redisClient, // use redis client
  _time: function () {
    return +(new Date()); // as timestamp
  },
  _callbackOnChange: function (callback) {
    return function (error, reply) {
      if (error) callback(error);
      else callback(null, (reply == SUCCESS));
    }
  }
};

module.exports = handler;
