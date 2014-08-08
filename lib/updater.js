var _ = require('underscore');

var Search = require('./search');
var Updater = require('./update');

/**
 * Wrapper for run search process asynchronously
 */
function UpdateWrapper () {}

UpdateWrapper.prototype.getUpdater = function () {
  if (!_.isObject(this.updater)) {
    this.updater = new Updater();
  }

  return this.updater;
}

UpdateWrapper.prototype.activateCacheUpdater = function () {
  var fn = function (eventChannel, key) {
    var search = new Search();
    search.refresh(key);
  }
  this.getUpdater().activate(fn);
}

UpdateWrapper.prototype.deactivateCacheUpdater = function () {
  this.getUpdater().deactivate();
}

module.exports = new UpdateWrapper();
