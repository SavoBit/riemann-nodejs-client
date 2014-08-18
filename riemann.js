var Client = require('./riemann/client').Client;
var Server = require('./riemann/server').Rie;

// convenience method, how convenient.
exports.createClient = function(options, onConnect) {
  return new Client(options, onConnect);
};

exports.createServer = function(options, onConnect) {
  return new Server(options, onConnect);
};
