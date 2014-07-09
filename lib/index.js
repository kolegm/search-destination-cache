var util = require('util');
var client = require('./db-client');

function Controller () {}

/**
 * @access public
 */
controller.prototype.search = function (address, callback, options) {
  this.executeSearch(address, callback, options);
};

/**
 * @access public
 */
controller.prototype.reverse = function (lat, lng, callback, options) {
  this.executeReverse(lat, lng, callback, options);
};

module.exports = new SearchWrapper();
