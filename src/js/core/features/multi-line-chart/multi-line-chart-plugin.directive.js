angular.module('linuxDash').directive('multiLineChartPlugin', [
  '$interval', '$compile', 'server', '$window',
  function ($interval, $compile, server, $window) {
    return {
      scope: {
        heading: '@',
        moduleName: '@',
        refreshRate: '=',
        getDisplayValue: '=',
        units: '=',
        delay: '='
      },
      templateUrl: 'src/js/core/features/multi-line-chart/multi-line-chart-plugin.html',
      link: function(scope, element) {

        var w, h, canvas

        angular.element($window).bind('resize', function() {
          canvas.width = w
          canvas.height = h
        })

        // smoothieJS - Create new chart
        var chart = new SmoothieChart({
          borderVisible: false,
          sharpLines: true,
          grid: {
            fillStyle: '#ffffff',
            strokeStyle: 'rgba(232,230,230,0.93)',
            sharpLines: true,
            borderVisible: false
          },
          labels: {
            fontSize: 12,
            precision: 0,
            fillStyle: '#0f0e0e'
          },
          maxValue: 100,
          minValue: 0,
          horizontalLines: [{
            value: 1,
            color: '#ecc',
            lineWidth: 1
          }]
        })

        var seriesOptions = [
          {
            strokeStyle: 'rgba(255, 0, 0, 1)',
            lineWidth: 2
          },
          {
            strokeStyle: 'rgba(0, 255, 0, 1)',
            lineWidth: 2
          },
          {
            strokeStyle: 'rgba(0, 0, 255, 1)',
            lineWidth: 2
          },
          {
            strokeStyle: 'rgba(255, 255, 0, 1)',
            lineWidth: 1
          }
        ]

        // smoothieJS - set up canvas element for chart
        scope.seriesArray  = []
        scope.metricsArray = []

        var delay = 1000

        if (angular.isDefined(scope.delay))
          delay = scope.delay

        var initializeChart = function () {
          // smoothieJS - set up canvas element for chart
          var checkForCanvasReadyState = $interval(function () {
            if (element.find('canvas')[0]) {
              canvas  = element.find('canvas')[0]
              w       = canvas.width
              h       = canvas.height

              // get the data once to set up # of lines on chart
              server.get(scope.moduleName, function(serverResponseData) {

                var numberOfLines = Object.keys(serverResponseData).length

                for (var x = 0; x < numberOfLines; x++) {

                  var keyForThisLine = Object.keys(serverResponseData)[x];

                  scope.seriesArray[x] = new TimeSeries();
                  chart.addTimeSeries(scope.seriesArray[x], seriesOptions[x]);
                  scope.metricsArray[x] = {
                    name: keyForThisLine,
                    color: seriesOptions[x].strokeStyle,
                  }
                }

              })

              chart.streamTo(canvas, delay)
              $interval.cancel(checkForCanvasReadyState)
            }
          }, 100)
        }

        scope.reInitializeChart = function () {
          chart.seriesSet.forEach(function (ts) {
            chart.removeTimeSeries(ts.timeSeries)
          })

          initializeChart()
        }

        if (!scope.isHidden)
          initializeChart()

        var dataCallInProgress = false

        // update data on chart
        scope.getData = function() {

          if (dataCallInProgress) return

          if (!scope.seriesArray.length) return

          dataCallInProgress = true

          server.get(scope.moduleName, function(serverResponseData) {

            dataCallInProgress = false
            scope.lastGet = new Date().getTime()
            var keyCount = 0
            var maxAvg = 100

            // update chart with current response
            for (var key in serverResponseData) {
              scope.seriesArray[keyCount].append(scope.lastGet, serverResponseData[key])
              keyCount++
              maxAvg = Math.max(maxAvg, serverResponseData[key])
            }

            // update the metrics for this chart
            scope.metricsArray.forEach(function(metricObj) {
              metricObj.data = serverResponseData[metricObj.name].toString() + ' ' + scope.units
            })

            // round up the average and set the maximum scale
            var len = parseInt(Math.log(maxAvg) / Math.log(10))
            var div = Math.pow(10, len)
            chart.options.maxValue = Math.ceil(maxAvg / div) * div

          })

        }

        var refreshRate = (angular.isDefined(scope.refreshRate)) ? scope.refreshRate : 1000
        var intervalRef = $interval(scope.getData, refreshRate)
        var removeInterval = function() {
          $interval.cancel(intervalRef)
        }

        element.on("$destroy", removeInterval)
      }
    }
}])
