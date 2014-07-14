
var client1 = require('./').getInstance({});

client1.set('aaa', 'aaa', function (err, reply) {
  console.log(reply);
});

var client2 = require('./').getInstance({});

client1.get('aaa', function (err, reply) {
  console.log(reply);
});