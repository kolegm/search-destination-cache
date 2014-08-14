var Search = require('./search');

/**
 * Wrapper for run search process asynchronously with a cache
 */
function SearchWrapper () {}

SearchWrapper.prototype.searchByAddress = function (address, callback) {
  var search = new Search();
  search.useAddress(address);
  search.execute(callback);
};

SearchWrapper.prototype.searchByCoordinates = function (latitude, longitude, callback) {
  var search = new Search();
  search.useCoordinates(latitude, longitude);
  search.execute(callback);
};

module.exports = new SearchWrapper();
