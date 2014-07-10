var util = require('util');

var Handler = require('./lib/redis');

var handler = new Handler();

handler.hmsetex('key', {'1':'1','2':'2'}, 60, function (error, data) {
  if (error) console.log('hmset e: ' + error);
  else console.log('hmset data: ' + data);
});

handler.hgetall('key', function (error, data) {
  if (error) console.log('hgetall e: ' + error);
  else console.log('hgetall data: ' + util.inspect(data));
});

handler.quit();
