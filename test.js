var util = require('util');

process.env.REDIS_DEBUG = 1;

var handler = require('./lib/redis')({});

handler.hmset('key', {'1':'1','2':'2'}, function (error, data) {
  if (error) console.log('hmset e: ' + error);
  else console.log('hmset data: ' + data);
});

handler.hgetall('key', function (error, data) {
  if (error) console.log('hgetall e: ' + error);
  else console.log('hgetall data: ' + util.inspect(data));
});

handler.quit();
