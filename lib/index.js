var Search = require('./search');

/**
 * Wrapper for run search process asynchronously
 */
function SearchWrapper () {}

SearchWrapper.prototype.searchByAddress = function (address, callback) {
  search = new Search();
  search.useAddress(address);
  search.execute(callback);
};

SearchWrapper.prototype.searchByCoordinates = function (latitude, longitude, callback) {
  search = new Search();
  search.useCoordinates(latitude, longitude);
  search.execute(callback);
};

module.exports = new SearchWrapper();
