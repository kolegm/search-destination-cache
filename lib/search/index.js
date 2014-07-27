var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var pubsub = require('../pubsub').getInstance({
  //debug_mode: true
});

var cache = require('./cache');
var SearchError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const EMPTY_ADDRESS_VALUE = '';
const EMPTY_COORDINATE_VALUE = 0;

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_ERROR = 'error';

const EVENT_SEARCH_FINISH = 'FINISH';

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

  cache.handler.checkState(
    self._getSearchKey(),
    function (error, state) {
      if (error) {
        callback(new SearchError(util.format(
          'Could not check the process state. Search key is \'%s\'',
          self._getSearchKey()
        )));
      } else {
        switch (state) {
          // search process was started before
          case PROCESS_STATE_BEGIN:
            self._subscribeFinish(callback);
            break;
          // wait for ending
          case PROCESS_STATE_END:
            self._result(callback);
            break;
          // search process has error, check it
          case PROCESS_STATE_ERROR:
            // todo
            callback(new SearchError(util.format(
              'Search process has state `error`. Search key is \'%s\'',
              self._getSearchKey()
            )));
            break;
          // start new search process
          default:
            self._start(callback);
        }
      }
    });
};

Search.prototype._start = function (callback) {
  var self = this;

  cache.handler.begin(
    self._getSearchKey(),
    self._getQuery(),
    function (error, result) {
      if (error || !result) {
        callback(new SearchError(util.format(
          'Could not start search process. Search key is \'%s\'',
          self._getSearchKey()
        )));
      } else {
        self._search(callback);
      }
    });
};

Search.prototype._search = function (callback) {
    switch (this._getSearchType()) {
    case SEARCH_TYPE_ADDRESS:
      sda.search({
        address: this._getAddress(),
        callbackOnTask: this._useSearchCallbackOnTaskFinish(),
        callbackOnFinish: this._useSearchCallbackOnProcessFinish(callback)
      });
      break;
    case SEARCH_TYPE_COORDINATES:
      sda.reverse({
        latitude: this._getCoordinates().latitude,
        longitude: this._getCoordinates().longitude,
        callbackOnTask: this._useSearchCallbackOnTaskFinish(),
        callbackOnFinish: this._useSearchCallbackOnProcessFinish(callback)
      });
      break;
  }
};

Search.prototype._useSearchCallbackOnTaskFinish = function () {
  return function (error, data) {
    if (!error && data) {
      this._publish(data);
    }
  }.bind(this);
}

Search.prototype._useSearchCallbackOnProcessFinish = function (callback) {
  this._subscribe(/*callback*/);
  this._subscribeFinish(callback);
  return function (error, data) {
    if (error) {
      this._publishFinish('Search process return error. Reason: ' + error);
    }
    else if (data) {
      this._publishFinish(data);
    }
    setTimeout(function () {
      this._unsubscribe();
      this._unsubscribeFinish();
    }.bind(this), 10);
  }.bind(this);
}

Search.prototype._result = function (callback) {
  var self = this;

  cache.response.get(
    self._getSearchKey(),
    function (error, data) {
      if (error) {
        callback(new SearchError(util.format(
          'Could not fetch result. Search key is \'%s\'',
          self._getSearchKey()
        )));
      }
      else if (_.isFunction(callback)) {
        callback(null, data);
      }
    });
};

Search.prototype._error = function (error) {
  cache.handler.error(
    this._getSearchKey(),
    error
  );
};

Search.prototype._subscribe = function (callback) {
  var self = this;

  pubsub.on(
    self._getSearchKey(),
    function (message) {
      cache.response.set(
        self._getSearchKey(),
        message
      );
    },
    callback
  );
};

Search.prototype._subscribeFinish = function (callback) {
  var self = this;

  pubsub.on(
    self._getSearchKeyEventFinish(),
    function (message) {
      cache.handler.end(self._getSearchKey());

      self._result(callback);
    },
    callback
  );
};

Search.prototype._unsubscribe = function () {
  pubsub.off(this._getSearchKey());
}

Search.prototype._unsubscribeFinish = function () {
  pubsub.off(this._getSearchKeyEventFinish());
}

Search.prototype._publish = function (message) {
  pubsub.emit(
    this._getSearchKey(),
    message
  );
};

Search.prototype._publishFinish = function (message) {
  pubsub.emit(
    this._getSearchKeyEventFinish(),
    message
  );
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

Search.prototype._getSearchKeyEventFinish = function () {
  return util.format(
    '%s:%s',
    EVENT_SEARCH_FINISH,
    this._getSearchKey()
  );
}

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
