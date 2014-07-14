const TEST_KEY = 'test_key';
const TEST_VALUE = 'test_val';

var client1 = require('./').getInstance({});

client1.set(TEST_KEY, TEST_VALUE, function (error, reply) {
  var mssg = 'SET: ' + TEST_KEY + ' > ' + TEST_VALUE + ' = ';
  if (error) console.log(mssg + 'failure');
  else console.log(mssg + reply);
});

var client2 = require('./').getInstance({});

client2.get(TEST_KEY, function (error, reply) {
  var mssg = 'GET: ' + TEST_KEY + ' = ';
  if (error) console.log(mssg + 'failure');
  else console.log(mssg + reply);
});

client1.quit();
client2.quit();
