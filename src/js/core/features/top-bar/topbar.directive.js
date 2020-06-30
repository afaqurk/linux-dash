angular.module('linuxDash').directive('topBar', ['$rootScope', function($rootScope) {
  return {
    scope: {
      heading: '=',
      refresh: '&',
      lastUpdated: '=',
      toggleVisibility: '&',
      isHidden: '=',
      toggleWidth: '&',
      isChart: '=',
      info: '=', // not being used; needs a good ui solution
    },
    template: '\
      <div class="top-bar"> \
        <span class="heading"> &#9776; {{ heading }}</span> \
        \
        <button \
          class="ld-top-bar-btn minimize-btn" \
          ng-click="toggleVisibility()" \
          ng-class="{ active: isHidden }">-</button> \
        \
        \
        <button class="ld-top-bar-btn width-toggle-btn" ng-if="toggleWidth && !isChart" ng-click="toggleWidth()">&harr;</button> \
        <button ng-if="!isChart && !isHidden" class="ld-top-bar-btn refresh-btn" ng-click="refresh()">↺</button> \
      </div> \
    ',
  }
}])
