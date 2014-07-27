var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var pubsub = require('../pubsub').getInstance({
  //debug_mode: true
});

var Base = require('./base');
var cache = require('./cache');
var SearchError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_ERROR = 'error';

function Search () {
  Base.call(this);
}

util.inherits(Search, Base);

Search.prototype.useAddress = function (address) {
  Search.super_.prototype.useAddress.call(this, address);
}

Search.prototype.useCoordinates = function (latitude, longitude) {
  Search.super_.prototype.useCoordinates.call(this, latitude, longitude);
}

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
            self._subscribeOnFinish(callback);
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
      this._publishData(data);
    }
  }.bind(this);
}

Search.prototype._useSearchCallbackOnProcessFinish = function (callback) {
  this._subscribeOnData();
  this._subscribeOnFinish(callback);
  return function (error, data) {
    if (error) {
      this._publishFinish('Search process return error. Reason: ' + error);
    }
    else if (data) {
      this._publishFinish(data);
    }
    setTimeout(function () {
      this._unsubscribeOnData();
      this._unsubscribeOnFinish();
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

Search.prototype._subscribeOnData = function (callback) {
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

Search.prototype._subscribeOnFinish = function (callback) {
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

Search.prototype._unsubscribeOnData = function () {
  pubsub.off(this._getSearchKey());
}

Search.prototype._unsubscribeOnFinish = function () {
  pubsub.off(this._getSearchKeyEventFinish());
}

Search.prototype._publishData = function (message) {
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

module.exports = Search;
