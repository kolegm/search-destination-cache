var crypto = require('crypto');

var model = require('./handler.json');

var handler = {
  prepareKey: function (str) {
    str = model.key + ':' str;
    var key = crypto
      .createHash('md5')
      .update(str)
      .digest('hex');

    return key;
  },
  checkState: function (key, callback) {
    redisClient.hmget(
      this.prepareKey(key),
      model.state.field,
      function (error, state) {
        if (error) callback(error);
        else {
          if (_.isEmpty(state)
              || (_.indexOf(model.handler.state.values, state) == -1))
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
    redisClient.hmset(
      this.prepareKey(key),
      model.state.field,
      'begin',
      //model.time_begin.field,
      // time,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == 'OK'));
      });
  },
  progress: function (key, callback) {
    redisClient.hmset(
      this.prepareKey(key),
      model.state.field,
      'progress',
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == 'OK'));
      });
  },
  end: function (key, callback) {
    redisClient.hmset(
      this.prepareKey(key),
      model.state.field,
      'end',
      //model.time_end.field,
      // time,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == 'OK'));
      });
  },
  error: function (key, callback) {
    redisClient.hmset(
      this.prepareKey(key),
      model.state.field,
      'error',
      //model.time_error.field,
      // time,
      function (error, reply) {
        if (error) callback(error);
        else callback(null, (reply == 'OK'));
      });
  }
};

module.exports = handler;
