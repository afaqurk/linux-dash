WebSocket Client & Server Implementation for Node
=================================================

[![npm version](https://badge.fury.io/js/websocket.svg)](http://badge.fury.io/js/websocket)

[![NPM Downloads](https://img.shields.io/npm/dm/websocket.svg)](https://www.npmjs.com/package/websocket)

[ ![Codeship Status for theturtle32/WebSocket-Node](https://codeship.com/projects/70458270-8ee7-0132-7756-0a0cf4fe8e66/status?branch=master)](https://codeship.com/projects/61106)

Overview
--------
This is a (mostly) pure JavaScript implementation of the WebSocket protocol versions 8 and 13 for Node.  There are some example client and server applications that implement various interoperability testing protocols in the "test/scripts" folder.

For a WebSocket client written in ActionScript 3, see my [AS3WebScocket](https://github.com/theturtle32/AS3WebSocket) project.


Documentation
=============

[You can read the full API documentation in the docs folder.](docs/index.md)


Changelog
---------

***Current Version: 1.0.31*** — Released 2019-12-06

* Fix [infinite loop in error handling](https://github.com/theturtle32/WebSocket-Node/issues/329) (Thanks, [@apirila](https://github.com/apirila))
* Fix [memory leak with multiple WebSocket servers on the same HTTP server](https://github.com/theturtle32/WebSocket-Node/pull/339) (Thanks, [@nazar-pc](https://github.com/nazar-pc))
* [Use es5-ext/global as a more robust way to resolve browser's window object](https://github.com/theturtle32/WebSocket-Node/pull/362) (Thanks, [@michaelsbradleyjr](https://github.com/michaelsbradleyjr))
* [Adding compatibility with V8 release greater than v7.6 (node and electron engines)](https://github.com/theturtle32/WebSocket-Node/pull/376) (Thanks, [@artynet](https://github.com/artynet))

[View the full changelog](CHANGELOG.md)

Browser Support
---------------

All current browsers are fully supported.

* Firefox 7-9 (Old) (Protocol Version 8)
* Firefox 10+ (Protocol Version 13)
* Chrome 14,15 (Old) (Protocol Version 8)
* Chrome 16+ (Protocol Version 13)
* Internet Explorer 10+ (Protocol Version 13)
* Safari 6+ (Protocol Version 13)

***Safari older than 6.0 is not supported since it uses a very old draft of WebSockets***

***If you need to simultaneously support legacy browser versions that had implemented draft-75/draft-76/draft-00, take a look here: https://gist.github.com/1428579***

Benchmarks
----------
There are some basic benchmarking sections in the Autobahn test suite.  I've put up a [benchmark page](http://theturtle32.github.com/WebSocket-Node/benchmarks/) that shows the results from the Autobahn tests run against AutobahnServer 0.4.10, WebSocket-Node 1.0.2, WebSocket-Node 1.0.4, and ws 0.3.4.

Autobahn Tests
--------------
The very complete [Autobahn Test Suite](http://autobahn.ws/testsuite/) is used by most WebSocket implementations to test spec compliance and interoperability.

- [View Server Test Results](http://theturtle32.github.com/WebSocket-Node/test-report/servers/)

Installation
------------

A few users have reported difficulties building the native extensions without first manually installing node-gyp.  If you have trouble building the native extensions, make sure you've got a C++ compiler, and have done `npm install -g node-gyp` first. 

Native extensions are optional, however, and WebSocket-Node will work even if the extensions cannot be compiled.

In your project root:

    $ npm install websocket
  
Then in your code:

```javascript
var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame  = require('websocket').frame;
var WebSocketRouter = require('websocket').router;
var W3CWebSocket = require('websocket').w3cwebsocket;
```

Note for Windows Users
----------------------
Because there is a small C++ component used for validating UTF-8 data, you will need to install a few other software packages in addition to Node to be able to build this module:

- [Microsoft Visual C++](http://www.microsoft.com/visualstudio/en-us/products/2010-editions/visual-cpp-express)
- [Python 2.7](http://www.python.org/download/) (NOT Python 3.x)


Current Features:
-----------------
- Licensed under the Apache License, Version 2.0
- Protocol version "8" and "13" (Draft-08 through the final RFC) framing and handshake
- Can handle/aggregate received fragmented messages
- Can fragment outgoing messages
- Router to mount multiple applications to various path and protocol combinations
- TLS supported for outbound connections via WebSocketClient
- TLS supported for server connections (use https.createServer instead of http.createServer)
  - Thanks to [pors](https://github.com/pors) for confirming this!
- Cookie setting and parsing
- Tunable settings
  - Max Receivable Frame Size
  - Max Aggregate ReceivedMessage Size
  - Whether to fragment outgoing messages
  - Fragmentation chunk size for outgoing messages
  - Whether to automatically send ping frames for the purposes of keepalive
  - Keep-alive ping interval
  - Whether or not to automatically assemble received fragments (allows application to handle individual fragments directly)
  - How long to wait after sending a close frame for acknowledgment before closing the socket.
- [W3C WebSocket API](http://www.w3.org/TR/websockets/) for applications running on both Node and browsers (via the `W3CWebSocket` class). 


Known Issues/Missing Features:
------------------------------
- No API for user-provided protocol extensions.


Usage Examples
==============

Server Example
--------------

Here's a short example showing a server that echos back anything sent to it, whether utf-8 or binary.

```javascript
#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
```

Client Example
--------------

This is a simple example client that will print out any utf-8 messages it receives on the console, and periodically sends a random number.

*This code demonstrates a client in Node.js, not in the browser*

```javascript
#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

client.connect('ws://localhost:8080/', 'echo-protocol');
```

Client Example using the *W3C WebSocket API*
--------------------------------------------

Same example as above but using the [W3C WebSocket API](http://www.w3.org/TR/websockets/).

```javascript
var W3CWebSocket = require('websocket').w3cwebsocket;

var client = new W3CWebSocket('ws://localhost:8080/', 'echo-protocol');

client.onerror = function() {
    console.log('Connection Error');
};

client.onopen = function() {
    console.log('WebSocket Client Connected');

    function sendNumber() {
        if (client.readyState === client.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            client.send(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
};

client.onclose = function() {
    console.log('echo-protocol Client Closed');
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
    }
};
```
    
Request Router Example
----------------------

For an example of using the request router, see `libwebsockets-test-server.js` in the `test` folder.


Resources
---------

A presentation on the state of the WebSockets protocol that I gave on July 23, 2011 at the LA Hacker News meetup.  [WebSockets: The Real-Time Web, Delivered](http://www.scribd.com/doc/60898569/WebSockets-The-Real-Time-Web-Delivered)
