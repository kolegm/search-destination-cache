var crypto = require('crypto');

var cache = require('./cache');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

function SearchProcess () {
  this.searchType = SEARCH_TYPE_ADDRESS; // as default
  this.address = '';
  this.latitude = 0;
  this.longitude = 0;
}

SearchProcess.prototype.searchByAddress = function (address) {
  this._useAddress(address);
};

SearchProcess.prototype.searchByCoordinates = function (latitude, longitude) {
  this._useCoordinates(latitude, longitude);
};

SearchProcess.prototype._run = function () {
  this.checkCache();
}

SearchProcess.prototype._getSearchKey = function () {
  var key = crypto
    .createHash('md5')
    .update(this._getSearchQuery())
    .digest('hax');

  return key;
}

SearchProcess.prototype._getSearchQuery = function () {
  var query;
  switch (this.searchType) {
    case SEARCH_TYPE_ADDRESS:
      query = this._getAddress();
      break;
    case SEARCH_TYPE_COORDINATES:
      query = this._getCoordinates();
      break;
    default:
      // call error
  }

  return query;
};

SearchProcess.prototype._useAddress = function (address) {
  this.searchType = SEARCH_TYPE_ADDRESS;
  //  todo: use it convert-logic in all modules
  this.address = String.prototype.toString(address);
  this.latitude = '';
  this.longitude = '';
}

SearchProcess.prototype._useCoordinates = function (latitude, longitude) {
  this.searchType = SEARCH_TYPE_COORDINATES;
  this.address = '';
  // todo: check isNaN
  this.latitude = parseFloat(latitude);
  this.longitude = parseFloat(longitude);
}

SearchProcess.prototype._getAddress = function () {}

SearchProcess.prototype._getCoordinates = function () {}

SearchProcess.prototype._checkAddress = function () {
  // in case when address is empty - show top popular places
}

SearchProcess.prototype._checkCoordinates = function () {
  // in case when address is empty - show top popular places
}

module.exports = new SearchProcess();
