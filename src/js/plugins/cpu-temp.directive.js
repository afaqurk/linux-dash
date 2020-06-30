angular.module('linuxDash').directive('cpuTemp', ['server', function(server) {
  return {
    restrict: 'E',
    scope: {},
    template: ' \
      <line-chart-plugin \
\
        heading="CPU temp" \
        module-name="cpu_temp" \
        color="0,255,0" \
\
        max-value="max" \
        min-value="min" \
        refresh-rate="1500" \
\
        get-display-value="displayValue" \
        metrics="utilMetrics"> \
      </line-chart-plugin> \
    ',
    link: function(scope) {
      scope.min = 0
      scope.max = 100

      scope.displayValue = function (serverResponseData) {
        return serverResponseData
      }

      scope.utilMetrics = [{
        name: 'Temprature',
        generate: function (serverResponseData) {
          return serverResponseData + ' °C'
        }
      }]

    }
  }
}])
