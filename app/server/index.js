var express = require('express')
var app     = require('express')()
var server  = require('http').Server(app)
var path    = require('path')
var spawn   = require('child_process').spawn
var fs      = require('fs')
var ws      = require('websocket').server
var args    = require('yargs').argv
var host    = args.host || process.env.LINUX_DASH_SERVER_HOST || '0.0.0.0'
var port    = args.port || process.env.LINUX_DASH_SERVER_PORT || 80

server.listen(port, host, function() {
  console.log('Linux Dash Server Started on ' + host + ':' + port + '!');
})

app.use(express.static(path.resolve(__dirname + '/../')))

app.get('/', function (req, res) {
	res.sendFile(path.resolve(__dirname + '/index.html'))
})

app.get('/websocket', function (req, res) {

  res.send({
    websocket_support: true,
  })

})

wsServer = new ws({
	httpServer: server
})

var nixJsonAPIScript = __dirname + '/linux_json_api.sh'

function getPluginData(pluginName, callback) {
  var command = spawn(nixJsonAPIScript, [ pluginName, '' ])
  var output  = []

  command.stdout.on('data', function(chunk) {
    output.push(chunk.toString())
  })

  command.on('close', function (code) {
    callback(code, output)
  })
}

wsServer.on('request', function(request) {

	var wsClient = request.accept('', request.origin)

  wsClient.on('message', function(wsReq) {

    var moduleName = wsReq.utf8Data
    var sendDataToClient = function(code, output) {
      if (code === 0) {
        var wsResponse = '{ "moduleName": "' + moduleName + '", "output": "'+ output.join('') +'" }'
        wsClient.sendUTF(wsResponse)
      }
    }

    getPluginData(moduleName, sendDataToClient)

  })

})

app.get('/server/', function (req, res) {

	var respondWithData = function(code, output) {
		if (code === 0) res.send(output.toString())
		else res.sendStatus(500)
	}

  getPluginData(req.query.module, respondWithData)
})
