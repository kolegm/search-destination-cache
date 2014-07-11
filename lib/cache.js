var redisClient = require('./redis')({
  // for redis options
});

function cache () {
  return {
    check: function (key, callback) {

    },
    begin: function (key, callback) {

    },
    process: function (key, callback) {

    },
    end: function (key, callback) {

    },
    error: function (key, callback) {

    },
  }
}


module.exports = cache;
