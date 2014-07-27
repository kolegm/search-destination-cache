var _ = require('underscore');
var util = require('util');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const EMPTY_ADDRESS_VALUE = '';
const EMPTY_COORDINATE_VALUE = 0;

function Base () {
  this._initDefaulValues();
};

Base.prototype.useAddress = function (address) {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = this._parseAddress(address);
  this.latitude = EMPTY_COORDINATE_VALUE;
  this.longitude = EMPTY_COORDINATE_VALUE;
};

Base.prototype.useCoordinates = function (latitude, longitude) {
  this.searchType = SEARCH_TYPE_COORDINATES;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: this._parseCoordinate(latitude),
    longitude: this._parseCoordinate(longitude)
  }
};

Base.prototype._getQuery = function () {
  return {
    type: this._getSearchType(),
    address: this._getAddress(),
    latitude: this._getCoordinates().latitude,
    longitude: this._getCoordinates().longitude
  };
}

Base.prototype._parseAddress = function (str) {
  str = _.isEmpty(str)
    ? EMPTY_ADDRESS_VALUE
    : (str).toString();

  return str;
};

Base.prototype._parseCoordinate = function (crd) {
  if (crd) {
    crd = parseFloat((crd).toString().replace(',','.'));
  }
  if (!_.isNumber(crd)) {
    crd = EMPTY_COORDINATE_VALUE;
  }

  return crd;
};

Base.prototype._getSearchType = function () {
  this._checkSearchType();
  return this.searchType;
};

Base.prototype._getAddress = function () {
  this._checkAddress();
  return this.address;
};

Base.prototype._getCoordinates = function () {
  this._checkCoordinates();
  return this.coordinates;
};

Base.prototype._checkSearchType = function () {
  switch (this.searchType) {
    case SEARCH_TYPE_ADDRESS:
      this._checkAddress();
      break;
    case SEARCH_TYPE_COORDINATES:
      this._checkCoordinates();
      break;
    default:
      throw new SearchError('Search type is not valid.');
  }
};

Base.prototype._checkAddress = function () {
  if (!_.isString(this.address))
    throw new SearchError('Address is not valid.');
};

Base.prototype._checkCoordinates = function () {
  var c = this.coordinates;
  if (!_.isNumber(c.latitude) || _.isNaN(c.latitude)
      || !_.isNumber(c.longitude) || _.isNaN(c.longitude))
  {
    throw new SearchError('Coordinates are not valid.');
  }
};

Base.prototype._initDefaulValues = function () {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: EMPTY_COORDINATE_VALUE,
    longitude: EMPTY_COORDINATE_VALUE
  };
};

module.exports = Base;
