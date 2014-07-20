var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./request.json');

const SUCCESS = 'OK';

function Request () {
  Base.call(this);
}

util.inherits(Request, Base);

Request.prototype.prepareKey = function (key) {
  key = util.format('%s:%s', model.namespace, key);
  var key = Base.prototype.prepareKey.call(this, key); // call the same parent method
};

Request.prototype.save = function (key, data) {
  this._client.setnx([
      this.prepareKey(key),
      model.data.field,
      data
    ],
    function (error, data) {
      if (error) callback(error);
      else callback(null, (reply == SUCCESS));
    }
  );
};

module.exports = new Request();
