var _ = require('underscore');
var util = require('util');

var Base = require('./base');
var model = require('./response.json');

const SUCCESS = 'OK';

function Response () {
  Base.call(this);
}

util.inherits(Response, Base);

Response.prototype.prepareKey = function (key) {
  key = util.format('%s:%s', model.namespace, key);
  var key = Base.prototype.prepareKey.call(this, key); // call the same parent method
};

Response.prototype.save = function (key, data) {
  this._client.rpush([
      this.prepareKey(key),
      model.data.field,
      data,
      model.time_update.field,
      this._time()
    ],
    function (error, data) {
      if (error) callback(error);
      else callback(null, (reply == SUCCESS));
    }
  );
};

module.exports = new Response();
