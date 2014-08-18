var assert   = require('assert');
var events   = require('events');
var inherits = require('util').inherits;
var hostname = require('os').hostname();

/* riemann uses Google Protocol Buffers
   as its wire transfer protocol. */
var Serializer = require('./serializer');


/* riemann communicates over UDP and TCP.
   UDP is way faster for sending events,
   so that whenever possible. You need to
   use TCP for sending queries though */
var Socket = require('./socket');


function _sendMessage(contents) {
  var self = this;
  return function() {
    // all events are wrapped in the Message type.
    var message = Serializer.serializeMessage(contents);
      this.send(message);
  };
}


/* some friendly defaults for event,
   in case they went missing. */
function _defaultValues(payload) {
  if (!payload.host)  { payload.host = hostname; }
  if (!payload.time)  { payload.time = new Date().getTime()/1000; }
  if (typeof payload.metric !== "undefined" && payload.metric !== null) {
    payload.metric_f = payload.metric;
    delete payload.metric;
  }
  return payload;
}


/* sets up a client connection to a Riemann server.
   options supports the following:
    - host (eg; my.riemannserver.biz)
    - port (eg; 5555 -- default) */
function Client(options, onConnect) {
  events.EventEmitter.call(this);
  if (!options) { options = {}; }
  options.host = options.host ? options.host : '127.0.0.1';
  options.port = options.port ? Number(options.port) : 5555;
  options.transport = options.transport ? options.transport : 'udp';


  if (onConnect) { this.once('connect', onConnect); }

  var self = this;

  if(options.transport === 'udp') {

    this.transport = 'udp';
    this.udp = new Socket.udpSocket(options);

    // proxy errors from UDP
    this.udp.socket.on('error', function(error) { self.emit('error', error); });

  } else if(options.transport === 'tcp') {

    this.transport = 'tcp';
    this.tcp = new Socket.tcpSocket(options);

    // proxy the TCP connect event.
    this.tcp.socket.on('connect', function() { self.emit('connect'); });

    // proxy errors from TCP
    this.tcp.socket.on('error', function(error) { self.emit('error', error); });

    // proxy data from TCP via deserialize
    this.tcp.onMessage(function(message) {
      self.emit('data', Serializer.deserializeMessage(message));
    });

  } else {
    //Unrecognised transport
    throw new Error("unrecognised transport - was expecting 'tcp' or 'udp'");
  }

}

inherits(Client, events.EventEmitter);
exports.Client = Client;


/* Submits an Event to the server.
   takes a key/value object of valid
   Event protocol buffer values. */
Client.prototype.Event = function(event) {
  event = _defaultValues(event);
  return _sendMessage.call(this, { events: [event] });
};


/* Submits a State to the server.
   takes a key/value object of valid
   State protocol buffer values. */
Client.prototype.State = function(state) {
  state = _defaultValues(state);
  return _sendMessage.call(this, { states: [state] });
};


/* Submits a Query to the server.
  takes a key/value object of valid
  Query protocol buffer values. */
Client.prototype.Query = function(query) {
  if (this.transport !== 'tcp'){
    throw new Exception("Cannot query riemann using UDP, you must use TCP");
  }
  return _sendMessage.call(this, { query: query });
};


/* sends a payload to Riemann. expects any valid payload type
   (eg: Event, State, Query...) */
Client.prototype.send = function(payload) {
  payload.apply(this[this.transport]);
};


/* disconnects our client (noop if using UDP) */
Client.prototype.disconnect = function(onDisconnect) {
  if (this.transport === 'tcp') {
    if (onDisconnect) { this.tcp.socket.once('end', onDisconnect); }
    this.tcp.socket.end();
  }
};
