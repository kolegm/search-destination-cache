var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var pubsub = require('../pubsub').getInstance();
var cache = require('./cache');
var SearchError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const EMPTY_ADDRESS_VALUE = '';
const EMPTY_COORDINATE_VALUE = 0;

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_PROGRESS = 'progress';
const PROCESS_STATE_ERROR = 'error';

function Search () {
  this._initDefaulValues();
}

Search.prototype.useAddress = function (address) {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = this._parseAddress(address);
  this.latitude = EMPTY_COORDINATE_VALUE;
  this.longitude = EMPTY_COORDINATE_VALUE;
};

Search.prototype.useCoordinates = function (latitude, longitude) {
  this.searchType = SEARCH_TYPE_COORDINATES;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: this._parseCoordinate(latitude),
    longitude: this._parseCoordinate(longitude)
  }
};

Search.prototype.execute = function (callback) {
  var self = this;
  var key = this._getSearchKey();

  cache.handler.checkState(
    key,
    function (error, state) {
      if (error) {
        callback(new SearchError(util.format(
          'Could not check the process state. Search key is \'%s\'',
          key
        )));
      } else {
        if (!state) {
          self._start(callback);
        } else {
          switch (state) {
            case PROCESS_STATE_BEGIN:
            case PROCESS_STATE_PROGRESS:
              self._subscribe(callback);
              break;
            case PROCESS_STATE_END:
              self._result(callback);
              break;
            case PROCESS_STATE_ERROR:
              callback(new SearchError(util.format(
                'Search process has state `error`. Search key is \'%s\'',
                key
              )));
              break;
          }
        }
      }
    });
};

Search.prototype._search = function (callback) {
  this._subscribe(callback);

  var callbackSearch = function (error, data) {
    if (error) {
      this._error(error);
      //this._publish(data);
    }
    else if (data) {
      this._publish(data);
    }
  }.bind(this);

  switch (this._getSearchType()) {
    case SEARCH_TYPE_ADDRESS:
      sda.search(
        this._getAddress(), 
        callbackSearch
      ); 
      break;
    case SEARCH_TYPE_COORDINATES:
      sda.reverse(
        this._getCoordinates().latitude,
        this._getCoordinates().longitude,
        callbackSearch
      ); 
      break;
  }
};

Search.prototype._start = function (callback) {
  var self = this;
  var key = this._getSearchKey();

  cache.handler.begin(
    key,
    this._getQuery(),
    function (error, result) {
      if (error || !result) {
        callback(new SearchError(util.format(
          'Could not begin search process. Search key is \'%s\'',
          key
        )));
      } else {
        self._search(callback);
      }
    });
};

Search.prototype._result = function (callback) {
  var key = this._getSearchKey();
  
  cache.response.get(
    key,
    function (error, data) {
      if (error) {
        callback(new SearchError(util.format(
          'Could not fetch result. Search key is \'%s\'',
          key
        )));
      }
      else callback(null, data);
    });
};

Search.prototype._error = function (error) {
  var key = this._getSearchKey();
  
  cache.handler.begin(key, error)
};

Search.prototype._subscribe = function (callback) {
  var self = this;
  pubsub.on(
    this._getSearchKey(),
    function (message) {
      //self._unsubscribe();
      cache.response.save(message);
    },
    callback
  );
};

Search.prototype._unsubscribe = function () {
  pubsub.off(this._getSearchKey());
}

Search.prototype._publish = function (message) {
  pubsub.emit(this._getSearchKey(), message);
};

Search.prototype._getSearchKey = function () {
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


Search.prototype._getQuery = function () {
  return {
    type: this._getSearchType(),
    address: this._getAddress(),
    latitude: this._getCoordinates().latitude,
    longitude: this._getCoordinates().longitude
  };
}

Search.prototype._parseAddress = function (str) {
  str = _.isEmpty(str)
    ? EMPTY_ADDRESS_VALUE
    : (str).toString();

  return str;
};

Search.prototype._parseCoordinate = function (crd) {
  if (crd) {
    crd = parseFloat((crd).toString().replace(',','.'));
  }
  if (!_.isNumber(crd)) {
    crd = EMPTY_COORDINATE_VALUE;
  }

  return crd;
};

Search.prototype._getSearchType = function () {
  this._checkSearchType();
  return this.searchType;
};

Search.prototype._getAddress = function () {
  this._checkAddress();
  return this.address;
};

Search.prototype._getCoordinates = function () {
  this._checkCoordinates();
  return this.coordinates;
};

Search.prototype._checkSearchType = function () {
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

Search.prototype._checkAddress = function () {
  if (!_.isString(this.address))
    throw new SearchError('Address is not valid.');
};

Search.prototype._checkCoordinates = function () {
  var c = this.coordinates;
  if (!_.isNumber(c.latitude) || _.isNaN(c.latitude)
      || !_.isNumber(c.longitude) || _.isNaN(c.longitude))
  {
    throw new SearchError('Coordinates are not valid.');
  }
};

Search.prototype._initDefaulValues = function () {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: EMPTY_COORDINATE_VALUE,
    longitude: EMPTY_COORDINATE_VALUE
  };
};

module.exports = Search;
