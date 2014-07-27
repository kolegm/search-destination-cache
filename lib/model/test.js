var util = require('util');
var _ = require('underscore');

var handler = require('./handler');

const KEY = process.argv[2] || 'foo';
const ADDRESS = { address: 'Kyiv, Petra Pancha' }

console.log(util.format('Handler process for KEY \'%s\'', KEY));

console.log(util.format('Prepared search KEY is \'%s\'', handler.prepareKey(KEY)));

handler.checkState(KEY, function (error, state) {
  if (error) console.log(util.format('FAILED. Check state by KEY \'%s\'', KEY));
  else {
    if (_.isEmpty(state)) {
      console.log('Process state is \'empty\'');

      handler.begin(KEY, ADDRESS, function (error, reply) {
        if (error) {
          console.log(util.format('Failed. Begin process by KEY \'%s\'. Reason: %s', KEY, error.message));
        }
        else {
          console.log(util.format('Begin process by KEY \'%s\'.', KEY));
        }
      });
    } else {
      console.log(util.format('Process state is \'%s\'', state));

    }
  }
});

//exit from redis

setTimeout( function () {
  require('../redis').getInstance().end()
}, 1000);
