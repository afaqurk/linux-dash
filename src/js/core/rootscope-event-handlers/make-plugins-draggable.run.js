angular
  .module('linuxDash')
  .run(['$rootScope', '$location', function ($rootScope, $location) {

    $rootScope.$on('$routeChangeSuccess', function () {

      var intervalId = setInterval(function () {

        var el = document.getElementById('plugins')

        if (el) {

          var sortable = Sortable.create(el, {
            group: 'plugin-order-' + $location.path().replace('/', ''),
            handle: '.heading',
            ghostClass: 'ld-ghost',
            chosenClass: 'ld-chosen',
            dataIdAttr: 'sortablejs-id',
            animation: 1050,
            store: {
              get: function (sortable) {
                var order = localStorage.getItem(sortable.options.group.name);
                return order ? order.split('|') : [];
              },
              set: function (sortable) {
                var order = sortable.toArray();
                localStorage.setItem(sortable.options.group.name, order.join('|'));
              }
            }
          })

          clearInterval(intervalId)
        }
      })
    })

  }])
