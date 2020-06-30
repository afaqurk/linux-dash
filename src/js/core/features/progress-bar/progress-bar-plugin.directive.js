angular.module('linuxDash').directive('progressBarPlugin', function() {
  return {
    scope: {
      width: '@',
      moduleName: '@',
      name: '@',
      value: '@',
      max: '@'
    },
    template: '\
      <div class="progress-bar-container">\
        <div class="progress-bar" style="width:{{width}};">\
          <div style="width: {{ (value/max) * 100 }}%;"></div>\
        </div>\
      </div>\
    '
  }
})
