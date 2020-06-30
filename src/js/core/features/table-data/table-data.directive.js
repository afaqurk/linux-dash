angular.module('linuxDash').directive('tableData', ['server', '$rootScope', function (server, $rootScope) {
  return {
    scope: {
      heading: '@',
      info: '@',
      moduleName: '@',
      width: '@',
      height: '@'
    },
    templateUrl: 'src/js/core/features/table-data/table-data.html',
    link: function(scope, element) {

      scope.sortByColumn = null
      scope.sortReverse = null

      // set the column to sort by
      scope.setSortColumn = function(column) {

        // if the column is already being sorted
        // reverse the order
        if (column === scope.sortByColumn) {
          scope.sortReverse = !scope.sortReverse
        } else {
          scope.sortByColumn = column
        }

        scope.sortTableRows()
      }

      scope.sortTableRows = function() {
        scope.tableRows.sort(function(currentRow, nextRow) {

          var sortResult = 0

          if (currentRow[scope.sortByColumn] < nextRow[scope.sortByColumn]) {
            sortResult = -1
          } else if (currentRow[scope.sortByColumn] === nextRow[scope.sortByColumn]) {
            sortResult = 0
          } else {
            sortResult = 1
          }

          if (scope.sortReverse) {
            sortResult = -1 * sortResult
          }

          return sortResult
        })
      }

      scope.getData = function() {
        delete scope.tableRows

        server.get(scope.moduleName, function(serverResponseData) {

          if (serverResponseData.length > 0) {
            scope.tableHeaders = Object.keys(serverResponseData[0])
          }

          scope.tableRows = serverResponseData

          if (scope.sortByColumn) {
            scope.sortTableRows()
          }

          scope.lastGet = new Date().getTime()

          if (serverResponseData.length < 1) {
            scope.emptyResult = true
          }

          if (!scope.$$phase && !$rootScope.$$phase) scope.$digest()
        })
      }

      scope.getData()
    }
  }
}])
