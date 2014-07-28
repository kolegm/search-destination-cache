var cache = {
  handler: require('../model/handler'),
  response: require('../model/response'),
  
  end: function () {
    this.handler.end();
    this.response.end();
  }
};

module.exports = cache;
