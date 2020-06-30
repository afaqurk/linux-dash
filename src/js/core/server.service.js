angular
  .module('linuxDash')
  .service('server', [
    '$http', '$rootScope', '$location',
    function($http, $rootScope, $location) {

      var websocket = {
        connection: null,
        onMessageEventHandlers: {}
      };

      /**
       * @description:
       *   Establish a websocket connection with server
       *
       * @return Null
       */
      var establishWebsocketConnection = function() {

        var websocketUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.hostname + ':' + window.location.port;

        if (websocket.connection === null) {

          websocket.connection = new WebSocket(websocketUrl);

          websocket.connection.onopen = function() {
            $rootScope.$broadcast("start-linux-dash", {});
            $rootScope.$apply();
            console.info('Websocket connection is open');
          };

          websocket.connection.onmessage = function(event) {

            var response = JSON.parse(event.data);
            var moduleName = response.moduleName;
            var moduleData = JSON.parse(response.output);

            if (!!websocket.onMessageEventHandlers[moduleName]) {
              websocket.onMessageEventHandlers[moduleName](moduleData);
            } else {
              console.info("Websocket could not find module", moduleName, "in:", websocket.onMessageEventHandlers);
            }

          };

          websocket.connection.onclose = function() {
            websocket.connection = null;
          }
        }

      };

      /**
       * @description:
       *   Check if websockets are supported
       *   If so, call establishWebsocketConnection()
       *
       * @return Null
       */
      this.checkIfWebsocketsAreSupported = function() {

        var websocketSupport = {
          browser: null,
          server: null,
        };

        // does browser support websockets?
        if (window.WebSocket) {

          websocketSupport.browser = true;

          // does backend support websockets?
          $http.get("/websocket").then(function(response) {

            // if websocket_support property exists and is trurthy
            // websocketSupport.server will equal true.
            websocketSupport.server = !!response.data["websocket_support"];

          }).catch(function websocketNotSupportedByServer() {

            websocketSupport.server = false;
            $rootScope.$broadcast("start-linux-dash", {});

          }).then(function finalDecisionOnWebsocket() {

            if (websocketSupport.browser && websocketSupport.server) {

              establishWebsocketConnection();

            } else {
              $rootScope.$broadcast("start-linux-dash", {});
            }

          });

        }

      };

      /**
       * Handles requests from modules for data from server
       *
       * @param  {String}   moduleName
       * @param  {Function} callback
       * @return {[ Null || callback(server response) ]}
       */
      this.get = function(moduleName, callback) {

        // if we have a websocket connection
        if (websocket.connection) {

          // and the connection is ready
          if (websocket.connection.readyState === 1) {

            // set the callback as the event handler
            // for server response.
            //
            // Callback instance needs to be overwritten
            // each time for this to work. Not sure why.
            websocket.onMessageEventHandlers[moduleName] = callback;

            //
            websocket.connection.send(moduleName);

          } else {
            console.log("Websocket not ready yet.", moduleName);
          }

        }
        // otherwise
        else {

          var moduleAddress = 'server/?module=' + moduleName;

          return $http.get(moduleAddress).then(function(response) {
            return callback(response.data);
          });

        }

      };

    }
])
