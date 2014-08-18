var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var riemann = require('../');

var tcpClient;
var udpClient;

test("should connect to server with TCP", function(done) {
  tcpClient = riemann.createClient({transport:'tcp'});
  assert(tcpClient instanceof EventEmitter);
  tcpClient.on('connect', done);
});

//Yeah, this is a pointless for the most part
test("should connect to server with UDP", function(done) {
  udpClient = riemann.createClient({transport:'udp'});
  assert(udpClient instanceof EventEmitter);
  done()
});

var server_down;
test("should fire error event when trying to connect via TCP", function(done) {
  server_down = riemann.createClient({port: 66500, transport: 'tcp'});
  server_down.on('error', function(e) {
    assert(e instanceof Error);
    done();
  });
});


test("should send an event as udp", function(done) {
  udpClient.send(udpClient.Event({
    service : 'hello_udp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }));
  done();
});


test("should send an event as tcp", function(done) {
  var counter = 10;

  var listener;
  tcpClient.on('data', listener = function(data) {
    assert(data.ok);
    if (--counter === 0) {
      tcpClient.removeListener('data', listener);
      setTimeout(done, 100);
    }
  });

  for (var i = Number(counter); i >= 0; i--) {
    tcpClient.send(tcpClient.Event({
      service : 'hello_tcp_'+i,
      metric  : Math.random(100)*100,
      tags    : ['bar'] }));
  }

});


test("should send a state as udp", function(done) {
  udpClient.send(udpClient.State({
    service: 'state_udp',
    state: 'ok'
  }));
  done();
});


test("should send a state as tcp", function(done) {
  var counter = 10;

  var listener;
  tcpClient.on('data', listener = function(data) {
    assert(data.ok);
    if (--counter === 0) {
      tcpClient.removeListener('data', listener);
      setTimeout(done, 100);
    }
  });

  for (var i = Number(counter); i >= 0; i--) {
    tcpClient.send(tcpClient.State({
      service: 'state_tcp',
      state: 'ok'
    }), tcpClient.tcp);
  }
});


test("should query the server via tcp", function(done) {
  tcpClient.on('data', function(data) {
    assert(data.ok);
    assert(Array.isArray(data.events));
    setTimeout(done, 100);
  });
  tcpClient.send(tcpClient.Query({
    string: "true"
  }));

});

test("should throw an exception when trying to query via udp", function(done){

  assert.throws(
    function(){
      udpClient.send(udpClient.Query({
        string: "true"
      }))}
  )
  done();

});

test("should disconnect from server", function(done) {
  tcpClient.disconnect(done);
});

