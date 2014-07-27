const TEST_CHANNEL = 'channel_foo';
const MESSAGE = { test: 'foo' };

var util = require('util');

var client = require('./').getInstance({
  //debug_mode: 1
});

// subscribe
client.on(
  TEST_CHANNEL,
  // handler
  function (message) {
    console.log('received message: ' + util.inspect(message));

    client.off(TEST_CHANNEL);
  }
);

// publish
setTimeout( function () {
  console.log('send a message: ' + util.inspect(MESSAGE));
  client.emit(TEST_CHANNEL, MESSAGE);
}, 1000);

// close redis connection
setTimeout( function () {
  client.end();
}, 5000);
