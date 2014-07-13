var searcher = require('./');

var callback = function (error, data) {
  if (error) console.log(error);
  else console.log(data);
};

searcher.searchByAddress('kyiv, petra pancha', callback);
searcher.searchByCoordinates('1.234', '2.345', callback);
