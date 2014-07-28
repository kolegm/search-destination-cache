const TEST_CHANNEL = 'channel_foo';
const MESSAGE = { test: 'foo' };

var util = require('util');

var client = require('./').getInstance({
  //debug_mode: 1
});

// subscribe
client.onData(
  TEST_CHANNEL,
  // handler
  function (message) {
    console.log('received message: ' + util.inspect(message));

    client.end();
  }
);

// publish
setTimeout( function () {
  console.log('send a message: ' + util.inspect(MESSAGE));
  client.emit(TEST_CHANNEL, MESSAGE);
}, 1000);
