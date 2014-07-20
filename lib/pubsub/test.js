const TEST_CHANNEL = 'channel_foo';

var util = require('util');

var client = require('./').getInstance({
  //debug_mode: 1
});

// subscribe
client.on(
  TEST_CHANNEL,
  // handler
  function (message) {
    console.log('handler: ' + util.inspect(message));
  },
  // callback
  function (error, data) {
    if (error) console.log('error: ' + error.message);
    else console.log('data: ' + util.inspect(data));
  }
);

// publish
setTimeout( function () {
  client.emit(TEST_CHANNEL, { test: 'foo' });
}, 1000);

// close redis connection
setTimeout( function () {
  client.end();
}, 5000);
