function runFn(server, $location, $rootScope) {
  server.checkIfWebsocketsAreSupported()

  $rootScope.$on("$locationChangeSuccess", function(event, next, current) {
    var nextRoute = next.split('#')[1]
    if (nextRoute !== '/loading') {
      localStorage.setItem('currentTab', nextRoute)
    }
  });

  $location.path('/loading')
}

angular
  .module('linuxDash', ['ngRoute'])
  .run([ 'server', '$location', '$rootScope', runFn])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false)
  }])
