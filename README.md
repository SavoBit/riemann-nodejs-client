# [Riemann](https://aphyr.github.io/riemann/) Node.js Client (in pure JS)

because you should be monitoring all of those [non-blocking buffet plates.](http://www.infinitelooper.com/?v=-sfZqL4Plxc&p=n#/242;267)

Riemannjs uses [ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js), so no native dependencies or complication required.

## Installation

```
npm install riemannjs [--save]
```

## Getting Started

first things first, we'll want to establish a new client:

```js
var client = require('riemannjs').createClient({
  host: 'some.riemann.server',
  port: 5555,
  transport: 'udp' //This is the default, you could set it to 'tcp'
});

// If we used TCP for the trasnport we could listen for this
client.on('connect', function() {
  console.log('connected!');
});
```

Just like [Riemann ruby client](https://github.com/aphyr/riemann-ruby-client), the client sends small events over UDP, by default. TCP is needed for queries, and large events (where large is determined by many factors like network MTU). There is no acknowledgement of UDP packets, but they are roughly an order of magnitude faster than TCP.

sending events is easy (see [list of valid event properties](https://aphyr.github.io/riemann/concepts.html)):

```js
client.send(client.Event({
  service: 'buffet_plates',
  metric:  252.2,
  tags:    ['nonblocking']
}));
```

If you wanted to send that message over TCP and receive an acknowledgement, you can specify the protocol during connection, explicitly:

```js

var client = require('riemannjs').createClient({
  host: 'some.riemann.server',
  port: 5555,
  transport: 'tcp'
})

client.on('data', function(ack) {
  console.log('got it!');
});

client.send(client.Event({
  service: 'buffet_plates',
  metric:  252.2,
  tags:    ['nonblocking']
}));
```

When you're done monitoring/querying, disconnect if you are using TCP:

```js
client.on('disconnect', function(){
  console.log('disconnected!');
});
client.disconnect();
```

## Notes

If the `metric` field is supplied, it's contents are converted to a protobuf `float` before transmission rather than `sint64` or `double`

## Contributing

Contributing is easy, just send a pull request, or make an issue / feature request. Please take a look at the project issues, to see how you can help. Here are some helpful tips:

- install the developer dependencies using `npm install --dev`
- please add tests. I'm using [Mocha](https://visionmedia.github.io/mocha/) as a test runner, you can run the tests using `npm test`
- please check your syntax with the included jshint configuration using `npm run-script lint`. It shouldn't report any errors.

## License

MIT
