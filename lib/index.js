var _ = require('underscore');

var Search = require('./search');
var CacheUpdater = require('./cache/updater');

/**
 * Wrapper for run search process asynchronously
 */
function SearchWrapper () {
  this.activateCacheUpdater();
}

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

SearchWrapper.prototype.getCacheUpdater = function () {
  if (!_.isObject(this.updater)) {
    this.updater = new CacheUpdater();
  }

  return this.updater;
}

SearchWrapper.prototype.activateCacheUpdater = function () {
  var fn = function (eventChannel, key) {
    var search = new Search();
    search.refresh(key);
  }
  this.getCacheUpdater().activate(fn);
}

module.exports = new SearchWrapper();
