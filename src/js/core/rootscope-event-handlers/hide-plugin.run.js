angular
  .module('linuxDash')
  .run(['$rootScope', '$location', function ($rootScope, $location) {

    var key = 'hiddenPlugins'

    var getHiddenPlugins = function () {
      var hiddenPluginsCSV = localStorage.getItem(key) || ''
      return hiddenPluginsCSV.split(',')
    }

    var updateHiddenPlugins = function (hiddenPlugins) {
      localStorage.setItem(key, hiddenPlugins.join(','))
    }

    $rootScope.$on('hide-plugin', function (e, m) {
      var hiddenPlugins = getHiddenPlugins()

      if(hiddenPlugins.indexOf(m) < 0)
        hiddenPlugins.push(m)

      updateHiddenPlugins(hiddenPlugins)
    })

    $rootScope.$on('show-plugin', function (e, m) {
      var hiddenPlugins = getHiddenPlugins()
      var indexOfPlugin = hiddenPlugins.indexOf(m)

      if(indexOfPlugin > -1)
        hiddenPlugins.splice(indexOfPlugin, 1)

      updateHiddenPlugins(hiddenPlugins)
    })

    $rootScope.hiddenPlugins = getHiddenPlugins()

  }])
