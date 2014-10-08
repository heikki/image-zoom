/* jshint node:true */

'use strict';

var gulp           = require('gulp');
var gutil          = require('gulp-util');
var plugins        = require('gulp-load-plugins')();

var fs             = require('fs');
var del            = require('del');
var nib            = require('nib');
var minimist       = require('minimist');
var runSequence    = require('run-sequence');
var browserSync    = require('browser-sync');
var mainBowerFiles = require('main-bower-files');

var DEST = '.build';
var IMAGES = minimist(process.argv.slice(2)).images || 'assets';

var paths = {
	vendor: mainBowerFiles(),
	scripts: [
		'app/index.js',
		'app/**/*.js'
	],
	styles: {
		src: 'app/index.styl',
		watch: 'app/**/*.styl'
	},
	views: 'app/**/*.jade'
};

function plumb(emitEnd) {
	return plugins.plumber({
		errorHandler: function(error) {
			gutil.log(gutil.colors.red(error.message));
			if (emitEnd) {
				this.emit('end');
			}
		}
	});
}

gulp.task('vendor', function() {
	return gulp.src(paths.vendor)
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.concat('vendor.js'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(DEST + '/scripts'));
});

gulp.task('scripts', function() {
	return gulp.src(paths.scripts)
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.concat('all.js'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(DEST + '/scripts'));
});

gulp.task('styles', function() {
	return gulp.src(paths.styles.src)
		.pipe(plumb(true))
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.stylus({ use: [ nib() ] }))
		.pipe(plugins.concat('all.css'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(DEST + '/styles'));
});

gulp.task('views', function() {
	return gulp.src(paths.views)
		.pipe(plugins.cached('views'))
		.pipe(plumb(false))
		.pipe(plugins.jade({ pretty: true }))
		.pipe(gulp.dest(DEST));
});

gulp.task('clean', function(cb) {
	del([DEST], cb);
});

gulp.task('build', function(cb) {
	runSequence('clean', ['vendor', 'scripts', 'styles', 'views'], cb);
});

gulp.task('default', ['build'], function() {
	// Dev server
	browserSync({
		port: 4000,
		server: {
			baseDir: [DEST, IMAGES],
			middleware: function(req, res, next) {
				if (req.url !== '/images.json') {
					next();
					return;
				}
				var files = fs.readdirSync(IMAGES).filter(function(filename) {
					return filename.match(/\-(left|right).jpg$/);
				}).map(function(filename) {
					return filename.replace(/\-(left|right).jpg$/, '');
				}).filter(function(filename, index, self) {
					return self.indexOf(filename) === index;
				});
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(files));
			}
		},
		files: [ DEST + '/**/*.*', '!' + DEST + '/**/*.map' ],
		logFileChanges: false,
		notify: false
	});
	// Watch & run tasks
	Object.keys(paths).forEach(function(key) {
		gulp.watch(paths[key].watch || paths[key], [key]);
	});
});
