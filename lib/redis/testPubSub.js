const TEST_KEY = 'test_key';
const TEST_VALUE = 'test_val';

var util = require('util');

var client = require('./').getInstance({});

console.log(client);

client.end();