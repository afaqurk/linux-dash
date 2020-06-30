angular.module("linuxDash").directive("supervisorStatus", [
    "server",
    function (server) {
      return {
        restrict: "E",
        scope: {},
        template:
          '\
        <line-chart-plugin \
  \
            heading="Supervisor" \
            module-name="supervisor_status" \
            color="0,255,0" \
  \
            get-display-value="supDataDisplay" \
            metrics="supDataReturn"> \
        </line-chart-plugin> \
      ',
        link: function (scope) {
          // get max ram available on machine before we
          // can start charting
          server.get("supervisor_status", function (supdata) {
            scope.process = supdata.process;
            scope.status = supdata.status;
          });
  
          scope.supDataDisplay = function (serverResponseData) {
            return serverResponseData.used;
          };
  
  
          scope.supDataReturn = [
            {
              name: "Process",
              generate: function (serverResponseData) {
                var processname = serverResponseData.process;
                return processname;
              },
            },
            {
              name: "Available",
              generate: function (serverResponseData) {
                var availableRam = humanizeRam(serverResponseData.available);
                var totalRam = humanizeRam(serverResponseData.total);
                return availableRam + " of " + totalRam;
              },
            },
          ];
        },
      };
    },
  ]);