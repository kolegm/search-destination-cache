var _ = require('underscore');
var util = require('util');
var crypto = require('crypto');

var model = require('./handler.json');

const STATE_BEGIN = 'begin';
const STATE_PROGRESS = 'progress';
const STATE_END = 'end';
const STATE_ERROR = 'error';

const SUCCESS = 'OK';

var handler = {
  client: require('../redis').getInstance({
    debug: true
  }),
  prepareKey: function (key) {
    key = util.format('%s:%s', model.namespace, key);
    key = crypto
      .createHash('md5')
      .update(key)
      .digest('hex');

    return key;
  },
  checkState: function (key, callback) {
    this.client.hmget(
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
    this.client.hmset([
        this.prepareKey(key),
        model.state.field,
        STATE_BEGIN,
        //model.time_begin.field,
        // time,
      ],
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == SUCCESS));
      });
  },
  progress: function (key, callback) {
    this.client.hset(
      this.prepareKey(key),
      model.state.field,
      STATE_PROGRESS,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == SUCCESS));
      });
  },
  end: function (key, callback) {
    this.client.hmset(
      this.prepareKey(key),
      model.state.field,
      STATE_END,
      //model.time_end.field,
      // time,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == SUCCESS));
      });
  },
  error: function (key, callback) {
    this.client.hmset(
      this.prepareKey(key),
      model.state.field,
      STATE_ERROR,
      //model.time_error.field,
      // time,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == SUCCESS));
      });
  }
};

module.exports = handler;
