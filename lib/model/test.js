var util = require('util');
var handler = require('./handler');

var key = process.argv[2] || 'foo';

console.log(util.format('Handler process for key \'%s\'', key));

var key = handler.prepareKey(key);
console.log(util.format('Search key is \'%s\'', key));

handler.checkState(key, function (error, state) {
  if (error) console.log(util.format('Failed process by key \'%s\'', key));
  else {
    if (_.isEmpty(state)) {
      handler.begin(key, function (error, reply) {
        if (error) console.log(util.format('Failed begin process by key \'%s\'', key));
        else {
          handler.checkState(key, function (error, state) {
            if (error) console.log(util.format('Failed process by key \'%s\'', key));
            else {
              console.log('Process status is \'%s\'', state);
            }
          });
          console.log(util.format('Process state is \'%s\'', state));
          
        }
      });
    }
    console.log(util.format('Process state is \'%s\'', state));
  }
});

//exit from redis
var redisClient = require('../redis').getInstance();
redisClient.quit();
