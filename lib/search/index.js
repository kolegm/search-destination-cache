var _ = require('underscore');
var util = require('util');

var sda = require('search-destination-async');

var PubSubClient = require('../pubsub');
var Cache = require('../cache');
var Base = require('./base');
var SearchError = require('./error');

const SEARCH_TYPE_ADDRESS = 'address';
const SEARCH_TYPE_COORDINATES = 'coordinates';

const PROCESS_STATE_BEGIN = 'begin';
const PROCESS_STATE_END = 'end';
const PROCESS_STATE_ERROR = 'error';

const EVENT_SEARCH_FINISH = 'FINISH';

const PATTERN_KEY_TEMPLATE = '{<%=type%>}{<%=address%>}{<%=latitude%>}{<%=longitude%>}';

/**
 * console.log('HDL:{address}{phuket}{0}{0}'.match(PATTERN_KEY_TEMPLATE_PARSE));
 *  1. HDL        - string, model namespace
 *  2. address    - string, search type: address or coordinates
 *  3. phuket     - string, address or empty
 *  4. 0          - float, coordinate latitude
 *  5. 0          - float, coordinate longitude
 */
const PATTERN_KEY_TEMPLATE_PARSE = /([A-Z]+|[0-9\.]+)/ig;

/**
 * Constructor - create instance for running Search Process
 */
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

/**
 * Execute search process
 */
Search.prototype.execute = function (callback) {
  var self = this;

  this._getCache().check(
    self._getSearchKey(),
    function (error, state) {
      if (error) {
        callback(new SearchError(this._message('Could not CHECK the SEARCH PROCESS state.')));
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
            callback(new SearchError(self._message('SEARCH PROCESS has state `error`.')));
            self._finish();
            break;
          // start new search process
          default:
            self._start(callback);
        }
      }
    });
};

/**
 * Start search process
 */
Search.prototype._start = function (callback) {
  var self = this;

  this._getCache().start(
    self._getSearchKey(),
    self._getQuery(),
    function (error, result) {
      if (error || !result) {
        var localError = new SearchError(self._message('Could not START the SEARCH PROCESS.'));
        callback(localError);
        self._error(localError.message);

        self._finish();
      } else {
        self._search(callback);
      }
    });
};

/**
 * Run main searching
 */
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
      var error = new SearchError(this._message('Could not RUN the SEARCH PROCESS.'));
      callback(error);
      this._error(error.message);

      this._finish();
  }
};

/**
 * Call function when data received from suppliers
 */
Search.prototype._useSearchCallbackOnTaskFinish = function () {
  return function (error, data) {
    if (!error && data) {
      this._publishData(data);
    }
  }.bind(this);
}

/**
 * Call function when search process was completed
 */
Search.prototype._useSearchCallbackOnProcessFinish = function () {
  return function () {
    this._publishFinish();
  }.bind(this);
}

/**
 * Return search result
 */
Search.prototype._result = function (callback) {
  var self = this;

  this._getCache().getData(
    self._getSearchKey(),
    function (error, data) {
      if (error) {
        callback(new SearchError(this._message('Could not fetch result for SEARCH PROCESS.')));
      }
      else if (_.isFunction(callback)) {
        callback(null, data); // return result

        // expire search key
        this._getCache().expire(self._getSearchKey(), 10);
      }

      this._finish();

    }.bind(this));
};

/**
 * Refresh search process by expired key
 */
Search.prototype.refresh = function (key) {
  var result = key.match(PATTERN_KEY_TEMPLATE_PARSE);
  if (_.isEmpty(result)) return;
  
  var
      namespace = _.isEmpty(result[0]) ? '' : result[0].toString().toUpperCase()
    , searchType = _.isEmpty(result[1]) ? '' : result[1].toString().toLowerCase()
    , address = result[2]
    , latitude = result[3]
    , longitude = result[4]
    ;
  
  // check namespaces
  if (namespace !== this._getCache().getNamespace().toUpperCase()) {
    return;
  }
  
  // check search type and run search process
  switch (searchType) {
    case SEARCH_TYPE_ADDRESS:
      this.useAddress(address);
      break;
    case SEARCH_TYPE_COORDINATES:
      this.useCoordinates(latitude, longitude);
      break;
    default: // bad search type
      this._finish();
      return;
  }
  
  this.execute();
}

/**
 * Finish search process
 * Close all work with DB
 */
Search.prototype._finish = function () {
  this._getCache().end();
  this._getPubSub().end();
}

/**
 * Call function for handling of error
 */
Search.prototype._error = function (message) {
  this._getCache().error(
    this._getSearchKey(),
    message
  );
  this._finish();
};

Search.prototype._subscribeOnData = function () {
  var fn = function (data) {
    this._getCache().setData(
      this._getSearchKey(),
      data
    );
  }.bind(this);

  this._getPubSub().onData(this._getSearchKey(), fn);
};

Search.prototype._subscribeOnFinish = function (callback) {
  var fn = function () {
    this._getCache().finish(this._getSearchKey());
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
    PATTERN_KEY_TEMPLATE,
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

Search.prototype._getPubSub = function () {
  if (!_.isObject(this._pubsub)) {
    this._pubsub = PubSubClient.getInstance({
      //debug_mode: true
    });
  }

  return this._pubsub;
}

Search.prototype._getCache = function () {
  if (!_.isObject(this._cache)) {
    this._cache = new Cache();
  }

  return this._cache;
}

Search.prototype._message = function (_mssg) {
  var mssg = _.isEmpty(_mssg)
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
