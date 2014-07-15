var util = require('util');
var _ = require('underscore');
var handler = require('./handler');

var key = process.argv[2] || 'foo';

console.log(util.format('Handler process for key \'%s\'', key));

console.log(util.format('Prepared search key is \'%s\'', handler.prepareKey(key)));

handler.checkState(key, function (error, state) {
  if (error) console.log(util.format('FAILED. Check state by key \'%s\'', key));
  else {
    if (_.isEmpty(state)) {
      console.log('Process state is \'empty\'');
      
      handler.begin(key, function (error, reply) {
        if (error) {
          console.log(util.format('Failed. Begin process by key \'%s\'. Reason: %s', key, error.message));
        }
        else {
          console.log(util.format('Begin process by key \'%s\'.', key));
        }
      });
    } else {
      console.log(util.format('Process state is \'%s\'', state));

    }
  }
});

//exit from redis
//var redisClient = require('../redis').getInstance();
//redisClient.quit();
