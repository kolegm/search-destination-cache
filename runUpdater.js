var util = require('util');

var updater = require('./lib/updater');
updater.activateCacheUpdater();

setInterval(function () {
  console.log('memory usage: ' + util.inspect(process.memoryUsage()));
}, 3000);
