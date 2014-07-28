var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var PubSubClient = require('../pubsub');
var Base = require('./base');
var cache = require('./cache');
var SearchError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_ERROR = 'error';

const EVENT_SEARCH_FINISH = 'FINISH';

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

Search.prototype._getPubSub = function () {
  if (!_.isObject(this._pubsub)) {
    this._pubsub = PubSubClient.getInstance({
      //debug_mode: true
    });
  }
  
  return this._pubsub;
}

Search.prototype.execute = function (callback) {
  var self = this;
  
  cache.handler.checkState(
    self._getSearchKey(),
    function (error, state) {
      if (error) {
        callback(new SearchError(this._message('Could not check the process state.')));
      } else {
        switch (state) {
          // search process was started before, wait for ending
          case PROCESS_STATE_BEGIN:
            self._subscribeOnFinish(callback);
            break;
          // search process was started before and finished, return result
          case PROCESS_STATE_END:
            self._result(callback);
            break;
          // search process failed, check error
          case PROCESS_STATE_ERROR:
            // todo
            callback(new SearchError(this._message('Search process has state `error`.')));
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
        callback(new SearchError(this._message('Could not start search process.')));
      } else {
        self._search(callback);
      }
    });
};

Search.prototype._search = function (callback) {
  switch (this._getSearchType()) {
    case SEARCH_TYPE_ADDRESS:
      this._subscribeOnData();
      this._subscribeOnFinish(callback);
      sda.search({
        address: this._getAddress(),
        callbackOnTask: this._useSearchCallbackOnTaskFinish(),
        callbackOnFinish: this._useSearchCallbackOnProcessFinish()
      });
      break;
    case SEARCH_TYPE_COORDINATES:
      this._subscribeOnData();
      this._subscribeOnFinish(callback);
      sda.reverse({
        latitude: this._getCoordinates().latitude,
        longitude: this._getCoordinates().longitude,
        callbackOnTask: this._useSearchCallbackOnTaskFinish(),
        callbackOnFinish: this._useSearchCallbackOnProcessFinish()
      });
      break;
    default:
      callback(new SearchError(this._message('Could not start search process.')));
  }
};

Search.prototype._useSearchCallbackOnTaskFinish = function () {
  return function (error, data) {
    if (!error && data) {
      this._publishData(data);
    }
  }.bind(this);
}

Search.prototype._useSearchCallbackOnProcessFinish = function () {
  return function () {
    this._publishFinish();
  }.bind(this);
}

Search.prototype._result = function (callback) {
  var self = this;
  
  cache.response.get(
    self._getSearchKey(),
    function (error, data) {
      if (error) {
        callback(new SearchError(this._message('Could not fetch result.')));
      }
      else if (_.isFunction(callback)) {
        callback(null, data);
      }
      
      this._finish();
      
    }.bind(this));
};

Search.prototype._finish = function () {
  cache.end();
  this._getPubSub().end();
}

Search.prototype._error = function (error) {
  cache.handler.error(
    this._getSearchKey(),
    error
  );
  this._finish();
};

Search.prototype._subscribeOnData = function () {
  var fn = function (data) {
    cache.response.set(
      this._getSearchKey(),
      data
    );
  }.bind(this);
  
  this._getPubSub().onData(this._getSearchKey(), fn);
};

Search.prototype._subscribeOnFinish = function (callback) {
  var fn = function () {
    cache.handler.finish(this._getSearchKey());
    this._result(callback);
  }.bind(this);
  
  this._getPubSub().onFinish(this._getSearchKeyEventFinish(), fn);
};

Search.prototype._publishData = function (message) {
  this._getPubSub().emit(
    this._getSearchKey(),
    message
  );
};

Search.prototype._publishFinish = function () {
  this._getPubSub().emit(
    this._getSearchKeyEventFinish(),
    this._message('Search process has been finished.')
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

Search.prototype._message = function (_mssg) {
  mssg = _.isEmpty(_mssg)
    ? ''
    : (_mssg).toString().trim();
  
  mssg += util.format(
    ' Search key is \'%s\'',
    this._getSearchKey()
  );
  
  mssg = mssg.trim();
  
  return mssg;
}

module.exports = Search;
