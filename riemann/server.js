/**
 * Mock riemann server meant for helping with testing etc
 * Accepts inbound messages and emits events for them
 */

var dgram   = require('dgram');
var tcp     = require('net');
var inherits = require('util').inherits;
var Emitter = require('events').EventEmitter;


var Rie = function(optionss){

  EventEmitter.call(this);

  var self = this;

  if (!options) { options = {}; }
  options.host = options.host ? options.host : '127.0.0.1';
  options.port = options.port ? Number(options.port) : 5555;

  this.options = options;

  this.udp = dgram.createSocket("udp4");
  this.tcp = net.createServer();

  //Proxy errors
  this.tcp.on('error', function(error) { self.emit('error', error); });
  this.udp.on('error', function(error) { self.emit('error', error); });

};


util.inherits(Rie, EventEmitter);
exports.Rie = Rie;

Rie.prototype.start = function(callback) {

  var opts = this.opts;
  var started = 0;

  function ready(){
    started++;
    if(started >=2){
      callback();
    }
  }

  this.udp.bind(opts.port, opts.host, ready);
  this.tcp.listen(opts.port, opts.host, ready);

};
