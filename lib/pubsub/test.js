const TEST_KEY = 'test_key';
const TEST_VALUE = 'test_val';

var util = require('util');

var client = require('./').getInstance({});

client.on(
  'channel1',
  function (data) {
    console.log('handler: ' + data);
  },
  function (e, d) {
    if (e) console.log('e: ' + e.message);
    else console.log('data: ' + data);
  }
);

client.emit('channel1', 'test message');

client.end();
