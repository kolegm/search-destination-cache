var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var pubsub = require('./pubsub').getInstance();
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
  this._useCoordinates(latitude, longitude);
  this._execute(callback);
};

SearchProcess.prototype._execute = function (callback) {
  var self = this;
  var key = this._getSearchKey();

  cache.handler.checkState(
    key,
    function (error, state) {
      if (error) {
        callback(new SearchProcessError(util.format('Could not check process state. Search key is \'%s\'', key)));
      } else {
        if (!state) {
          self._start(callback);
        } else {
          switch (state) {
            case PROCESS_STATE_BEGIN:
            case PROCESS_STATE_PROGRESS:
              self._subscribe(callback);
              // subscribe on event end
              break;
            case PROCESS_STATE_END:
              self._result(callback);
              break;
            case PROCESS_STATE_ERROR:
              callback(new SearchProcessError(util.format('Search process has state `error`. Search key is \'%s\'', key)));
              break;
          }
        }
      }
    });
};

SearchProcess.prototype._search = function (callback) {
  this._subscribe(callback);

  var callbackSearch = function (error, data) {
    if (error) console.log('----------');
    else {
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
      /*sda.reverse(
        this._getCoordinates().latitude,
        this._getCoordinates().longitude,
        callback
      );*/ 
      break;
  }
};

SearchProcess.prototype._start = function (callback) {
  var self = this;
  var key = this._getSearchKey();

  cache.handler.begin(
    key,
    function (error, result) {
      if (error || !result) {
        callback(new SearchProcessError(util.format('Could not begin search process. Search key is \'%s\'', key)));
      } else {
        self._search(callback);
      }
    });
};

SearchProcess.prototype._result = function (callback) {
  var key = this._getSearchKey();
  
  cache.response.get(
    key,
    function (error, data) {
      if (error) {
        callback(new SearchProcessError(util.format('[2] Could not fetch result. Search key is \'%s\'', key)));
      }
      else callback(null, data);
    });
};

SearchProcess.prototype._subscribe = function (callback) {
  var self = this;
  pubsub.on(
    this._getSearchKey(),
    function (message) {
      //self._unsubscribe();
      console.log('handler: ' + util.inspect(message));
    },
    callback
  );
};

SearchProcess.prototype._unsubscribe = function () {
  pubsub.off(this._getSearchKey());
}

SearchProcess.prototype._publish = function (data) {
  pubsub.emit(this._getSearchKey(), data);
};

SearchProcess.prototype._getSearchKey = function () {
  return _.template(
    /**
     * Examples:
     *   {address}{Kyiv,Khrshchatyk}{}{} // when address
     *   {coordinates}{}{0.123}{1.234} // when coordinates
     */
    '{<%=type%>}{<%=address%>}{<%=latitude%>}{<%=longitude%>}',
    {
      type: this._getSearchType(),
      address: this._getAddress(),
      latitude: this._getCoordinates().latitude,
      longitude: this._getCoordinates().longitude
    }
  );
};

SearchProcess.prototype._useAddress = function (address) {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = this._parseAddress(address);
  this.latitude = EMPTY_COORDINATE_VALUE;
  this.longitude = EMPTY_COORDINATE_VALUE;
};

SearchProcess.prototype._useCoordinates = function (latitude, longitude) {
  this.searchType = SEARCH_TYPE_COORDINATES;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: this._parseCoordinate(latitude),
    longitude: this._parseCoordinate(longitude)
  }
};

SearchProcess.prototype._parseAddress = function (str) {
  str = _.isEmpty(str)
    ? EMPTY_ADDRESS_VALUE
    : (str).toString();

  return str;
};

SearchProcess.prototype._parseCoordinate = function (crd) {
  if (_.isNumber(crd))
    crd = parseFloat((crd).toString().replace(',','.'));

  if (isNaN(longitude))
    crd = EMPTY_COORDINATE_VALUE;

  return crd;
};

SearchProcess.prototype._getSearchType = function () {
  this._checkSearchType();
  return this.searchType;
};

SearchProcess.prototype._getAddress = function () {
  this._checkAddress();
  return this.address;
};

SearchProcess.prototype._getCoordinates = function () {
  this._checkCoordinates();
  return this.coordinates;
};

SearchProcess.prototype._checkSearchType = function () {
  switch (this.searchType) {
    case SEARCH_TYPE_ADDRESS:
      this._checkAddress();
      break;
    case SEARCH_TYPE_COORDINATES:
      this._checkCoordinates();
      break;
    default:
      throw new SearchProcessError('Search type is not valid.');
  }
};

SearchProcess.prototype._checkAddress = function () {
  if (_.isEmpty(this.address))
    throw new SearchProcessError('Address is not valid.');
};

SearchProcess.prototype._checkCoordinates = function () {
  var c = this.coordinates;
  if (!_.isNumber(c.latitude) || _.isNaN(c.latitude)
      || !_.isNumber(c.longitude) || _.isNaN(c.longitude))
  {
    throw new SearchProcessError('Coordinates are not valid.');
  }
};

SearchProcess.prototype._initDefaulValues = function () {
  this.searchType = SEARCH_TYPE_ADDRESS;
  this.address = EMPTY_ADDRESS_VALUE;
  this.coordinates = {
    latitude: EMPTY_COORDINATE_VALUE,
    longitude: EMPTY_COORDINATE_VALUE
  };
};

module.exports = new SearchProcess();
