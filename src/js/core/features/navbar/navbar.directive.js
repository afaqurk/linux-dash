angular.module('linuxDash').directive('navBar', ['$location', function($location) {
  return {
    template: '\
      \
      <span class="title">Linux Dash</span>\
      \
      <ul> \
        <li ng-class="{active: isActive(navItem) }" ng-repeat="navItem in items"> \
          <a href="#/{{navItem}}" ng-bind="getNavItemName(navItem)"></a> \
        </li> \
      </ul> \
      <span class="right-content">\
        Resources:\
        <a target="_blank" href="https://github.com/afaqurk/linux-dash">GitHub</a> | \
        <a target="_blank" href="https://gitter.im/afaqurk/linux-dash">Gitter Chat Room</a> | \
        <a target="_blank" href="https://github.com/afaqurk/linux-dash/wiki">Docs</a> \
      </span>\
    ',
    link: function(scope) {
      scope.items = [
        'system-status',
        'basic-info',
        'network',
        'accounts',
        'apps'
        'custom'
      ]

      scope.getNavItemName = function(url) {
        return url.replace('-', ' ')
      }

      scope.isActive = function(route) {
        return '/' + route === $location.path()
      }
    }
  }
}])
