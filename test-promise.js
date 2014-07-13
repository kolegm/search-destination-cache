var Promise = require('promise')//or require('q')

var read = Promise.denodeify(require('fs').readFile);

function readJSON(path, callback) {
  return read(path, 'utf8')
    .then(JSON.parse)
    .nodeify(callback)
}

// ---------------------

//if called with a callback
readJSON('foo.json', function (err, res) {
  if (err) throw err;
  console.dir(res)
})


//if called without a callback
readJSON('foo.json').then(function (res) {
  console.dir(res)
}).done()
