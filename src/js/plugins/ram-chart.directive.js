angular.module('linuxDash').directive('ramChart', ['server', function (server) {
  return {
    restrict: 'E',
    scope: {},
    template: '\
      <line-chart-plugin \
\
          heading="RAM Usage" \
          module-name="current_ram" \
          color="0,255,0" \
\
          max-value="maxRam" \
          min-value="minRam" \
          refresh-rate="1000" \
\
          get-display-value="ramToDisplay" \
          metrics="ramMetrics"> \
      </line-chart-plugin> \
    ',
    link: function(scope) {

      // get max ram available on machine before we
      // can start charting
      server.get('current_ram', function(resp) {
        scope.maxRam = resp.total
        scope.minRam = 0
      })

      scope.ramToDisplay = function(serverResponseData) {
        return serverResponseData.used
      }

      var humanizeRam = function (ramInMB) {
        var ram = {
          value: parseInt(ramInMB, 10),
          unit: 'MB',
        }

        // if ram > 1,000 MB, use GB
        if (ram.value > 1000) {
          ram = {
            value: (ramInMB/1024).toFixed(2),
            unit: 'GB',
          }
        }

        return ram.value + ' ' + ram.unit
      }

      scope.ramMetrics = [{
        name: 'Used',
        generate: function(serverResponseData) {
          var ratio = serverResponseData.used / serverResponseData.total
          var percentage = parseInt(ratio * 100)

          var usedRam = humanizeRam(serverResponseData.used)
          return usedRam + ' (' + percentage.toString() + '%)'
        }
      },
      {
        name: 'Available',
        generate: function(serverResponseData) {

          var availableRam = humanizeRam(serverResponseData.available)
          var totalRam = humanizeRam(serverResponseData.total)
          return  availableRam + ' of ' + totalRam
        }
      }]
    }
  }
}])
