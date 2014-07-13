var _ = require('underscore');
var sda = require('search-destination-async');

var cache = require('./cache');
var SearchProcessError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';
const EMPTY_ADDRESS_VALUE = '';
const EMPTY_COORDINATE_VALUE = 0;

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_PROGRESS = 'progress';
const PROCESS_STATE_ERROR = 'error';

function SearchProcess () {
  this._initDefaulValues();
}

SearchProcess.prototype.searchByAddress = function (address, callback) {
  this._useAddress(address);
  this._execute(callback);
};

SearchProcess.prototype.searchByCoordinates = function (latitude, longitude, callback) {
  //this._useCoordinates(latitude, longitude);
};

SearchProcess.prototype._execute = function (callback) {
  cache.handler.checkState(
    this._getSearchKey(),
    function (error, state) {
      if (error) {
        callback(new SearchProcessError('Could not check process state by key: ' + sk));
      } else {
        if (!state) {
          this._start(callback);
        } else {
          switch (state) {
            case PROCESS_STATE_BEGIN:
            case PROCESS_STATE_PROGRESS:
              this._subscribe(callback);
              // subscribe on event end
              break;
            case PROCESS_STATE_END:
              this._result(callback);
              break;
            case PROCESS_STATE_ERROR:
              callback(new SearchProcessError('Search process has state `error`.' + sk));
              break;
          }
        }
      }
    }
  );
}

SearchProcess.prototype._start = function (callback) {
  cache.handler.begin(this._getSearchKey(), function (error, result) {
    if (error) callback(new SearchProcessError('[1] Could not begin search process'));
    else {
      if (result) {
        this._subscribe(callback);
        sda.search(address, callbackSearch);
        //sda.reverse(latitude, longitude, callback);return;
      } else {
        callback(new SearchProcessError('[2] Could not begin search process'));
      }
    }
  });
});

SearchProcess.prototype._subscribe = function (callback) {
  cache.handler.begin(this._getSearchKey(), function () {

  });
});

SearchProcess.prototype._result = function (callback) {
  cache.response.get(this._getSearchKey(), function (error, data) {
    if (error) callback(new Error('Could not fetch result'));
    else callback(null, data);
  });
});

SearchProcess.prototype._getSearchKey = function () {
  return _.template(
    /**
     * Examples:
     *   {address}{Kyiv,Khrshchatyk}{}{} // when address
     *   {coordinates}{}{0.123}{1.234} // when coordinates
     */
    '{<%=type%>}{<%=address%>}{<%=latitude%>}{<%=longitude%>}',
    this._getQuery()
  );
};

SearchProcess.prototype._getQuery = function () {
  return {
    type: this._getSearchType(),
    address: this._getAddress(),
    latitude: this._getCoordinates().latitude,
    longitude: this._getCoordinates().longitude
  }
};

SearchProcess.prototype._useAddress = function (address) {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = this._parseAddress(address);
  this.latitude = EMPTY_COORDINATE_VALUE;
  this.longitude = EMPTY_COORDINATE_VALUE;
}

SearchProcess.prototype._useCoordinates = function (latitude, longitude) {
  this.searchType = SEARCH_TYPE_COORDINATES;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: this._parseCoordinate(latitude),
    longitude: this._parseCoordinate(longitude)
  }
}

SearchProcess.prototype._parseAddress = function (str) {
  str = _.isEmpty(str)
    ? EMPTY_ADDRESS_VALUE
    : (str).toString();

  return str;
}

SearchProcess.prototype._parseCoordinate = function (crd) {
  if (_.isNumber(crd))
    crd = parseFloat((crd).toString().replace(',','.'));

  if (isNaN(longitude))
    crd = EMPTY_COORDINATE_VALUE;

  return crd;
}

SearchProcess.prototype._getSearchType = function () {
  this._checkSearchType();
  return this.searchType;
}

SearchProcess.prototype._getAddress = function () {
  this._checkAddress();
  return this.address;
}

SearchProcess.prototype._getCoordinates = function () {
  this._checkCoordinates();
  return this.coordinates;
}

SearchProcess.prototype._checkSearchType = function () {
  switch (this.searchType) {
    case SEARCH_TYPE_ADDRESS:
      this._checkAddress();
      break;
    case SEARCH_TYPE_COORDINATES:
      this._checkCoordinates();
      break;
    default:
      throw new Error('Search type is not valid.');
  }
}

SearchProcess.prototype._checkAddress = function () {
  if (_.isEmpty(this.address))
    throw new Error('Address is not valid.');
}

SearchProcess.prototype._checkCoordinates = function () {
  var c = this.coordinates;
  if (!_.isNumber(c.latitude) || _.isNaN(c.latitude)
      || !_.isNumber(c.longitude) || _.isNaN(c.longitude))
  {
    throw new Error('Coordinates are not valid.');
  }
}

SearchProcess.prototype._initDefaulValues = function () {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: EMPTY_COORDINATE_VALUE,
    longitude: EMPTY_COORDINATE_VALUE
  };
}

module.exports = new SearchProcess();
