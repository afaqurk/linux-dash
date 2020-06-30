var g             = require('gulp')
var concat        = require('gulp-concat')
var uglify        = require('gulp-uglify')
var cssmin        = require('gulp-cssmin')
var gutil         = require('gulp-util')
var ngAnnotate    = require('gulp-ng-annotate')
var templateCache = require('gulp-angular-templatecache')

g.task('template-cache', function () {
  return g.src('src/**/*.html')
    .pipe(templateCache('templates.js', {
        module: 'linuxDash',
        standAlone: false,
        root: 'src/'
      }))
    .pipe(g.dest('temp/'))
})

g.task('generate-js-dist', ['template-cache'], function () {
  return g.src([
    'node_modules/angular/angular.min.js',
    'node_modules/angular-route/angular-route.min.js',
    'node_modules/smoothie/smoothie.js',
    'node_modules/sortablejs/Sortable.min.js',
    'src/js/**/*.js',
    'temp/templates.js'
  ])
  .pipe(concat('linuxDash.min.js'))
  .pipe(ngAnnotate())
  // .pipe(uglify())
  .on('error', gutil.log)
  .pipe(g.dest('app/'))
})

g.task('generate-css-dist', function () {
  return g.src([ 'src/**/*.css' ])
    .pipe(cssmin())
    .pipe(concat('linuxDash.min.css'))
    .pipe(g.dest('app/'))
})

g.task('build', [
  'generate-js-dist',
  'generate-css-dist'
])

g.task('watch', function () {
  g.watch('src/**/*.css', ['generate-css-dist'])
  g.watch(['src/**/*.js', 'src/**/*.html'], ['generate-js-dist'])
})

g.task('default', ['build', 'watch'])
