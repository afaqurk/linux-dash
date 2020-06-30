angular.module('linuxDash').directive('diskSpace', ['server', function(server) {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'src/js/plugins/disk-space/disk-space.html',
    link: function(scope) {

      var getKBMultiplierFn = function (size, power) {
        return function () {
          return size * Math.pow(1024, power)
        }
      }

      var kbDictionary = {
        'M': function () { return getKBMultiplierFn(size, 1) },
        'G': function () { return getKBMultiplierFn(size, 2) },
        'T': function () { return getKBMultiplierFn(size, 3) },
        'P': function () { return getKBMultiplierFn(size, 4) },
        'E': function () { return getKBMultiplierFn(size, 5) },
        'Z': function () { return getKBMultiplierFn(size, 6) },
        'Y': function () { return getKBMultiplierFn(size, 7) },
      }

      scope.heading = "Disk Partitions"
      scope.moduleName = 'disk_partitions'

      scope.getData = function() {
        server.get(scope.moduleName, function(serverResponseData) {
          scope.diskSpaceData = serverResponseData
        })

        scope.lastGet = new Date().getTime()
      }

      scope.getData()

      scope.getKB = function(stringSize) {

        var lastChar = stringSize.slice(-1)
        var size = parseFloat(stringSize.replace(",", "."))

        try {
          return kbDictionary[lastChar](size)
        } catch (err) {
          return size
        }
      }

    }
  }
}])
