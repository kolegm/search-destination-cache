var searcher = require('./');

var callback = function (error, data) {
  if (error) console.log(error.message);
  //else console.log(data);
};

searcher.searchByAddress('kyiv, Khreshchatyk', callback);

//searcher.searchByCoordinates('21.234', '13.345', callback);
//searcher.searchByCoordinates('22.234', '13.345', callback);

//setTimeout(function () {
//  searcher.searchByAddress('kyiv, Khreshchatyk', callback);
//}, 2000);

//setInterval(function () {
//  console.log('memory usage: ' + process.memoryUsage().heapUsed);
//}, 3000);


setTimeout(function () {
  console.log('deactivate');
  searcher.deactivateCacheUpdater();
}, 10000);