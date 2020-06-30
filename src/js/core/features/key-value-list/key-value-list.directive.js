angular.module('linuxDash').directive('keyValueList', ['server', '$rootScope', function (server, $rootScope) {
  return {
    scope: {
      heading: '@',
      info: '@',
      moduleName: '@',
    },
    templateUrl: 'src/js/core/features/key-value-list/key-value-list.html',
    link: function(scope, element) {

      scope.getData = function() {
        delete scope.tableRows

        server.get(scope.moduleName, function(serverResponseData) {
          scope.tableRows = serverResponseData
          scope.lastGet = new Date().getTime()

          if (Object.keys(serverResponseData).length === 0) {
            scope.emptyResult = true
          }

          if (!scope.$$phase && !$rootScope.$$phase) scope.$digest()
        })
      }

      scope.getData()
    }
  }
}])
