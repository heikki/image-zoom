/* jshint node:true */

'use strict';

var gulp           = require('gulp');
var gutil          = require('gulp-util');
var jade           = require('gulp-jade');
var stylus         = require('gulp-stylus');
var concat         = require('gulp-concat');
var cached         = require('gulp-cached');
var plumber        = require('gulp-plumber');
var runSequence    = require('run-sequence');
var del            = require('del');
var nib            = require('nib');
var express        = require('express');
var morgan         = require('morgan');
var tinylr         = require('tiny-lr');
var mainBowerFiles = require('main-bower-files');
var openBrowser    = require('open');
var fs             = require('fs');
// var minimist       = require('minimist');

var buildDir = '.build';

var IMAGE_PATH = process.env.IMAGE_PATH || 'assets/images';

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
	return plumber({
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
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest(buildDir + '/scripts'));
});

gulp.task('scripts', function() {
	return gulp.src(paths.scripts)
		.pipe(concat('all.js'))
		.pipe(gulp.dest(buildDir + '/scripts'));
});

gulp.task('styles', function() {
	return gulp.src(paths.styles.src)
		.pipe(plumb(true))
		.pipe(stylus({ use: [ nib() ] }))
		.pipe(concat('all.css'))
		.pipe(gulp.dest(buildDir + '/styles'));
});

gulp.task('views', function() {
	return gulp.src(paths.views)
		.pipe(cached('views'))
		.pipe(plumb(false))
		.pipe(jade({ pretty: true }))
		.pipe(gulp.dest(buildDir));
});

gulp.task('clean', function(cb) {
	del([buildDir], cb);
});

gulp.task('build', function(cb) {
	runSequence('clean', ['vendor', 'scripts', 'styles', 'views'], cb);
});

gulp.task('default', ['build'], function() {
	// Dev server
	var app = express();
	app.use(morgan('dev'));
	app.use(express.static(buildDir));
	app.use(express.static(IMAGE_PATH));
	app.get('/images.json', function(req, res) {
		var files = fs.readdirSync(IMAGE_PATH).filter(function(filename) {
			return filename.match(/\-(left|right).jpg$/);
		}).map(function(filename) {
			return filename.replace(/\-(left|right).jpg$/, '');
		}).filter(function onlyUnique(value, index, self) {
			return self.indexOf(value) === index;
		});
		res.json(files);
	});
	app.listen(4000);
	// Livereload
	var lr = tinylr();
	lr.listen(35729);
	gulp.watch(buildDir + '/**/*.*', function(event) {
		lr.changed({ body: { files: [ event.path ] } });
	});
	// Watch
	Object.keys(paths).forEach(function(key) {
		gulp.watch(paths[key].watch || paths[key], [key]);
	});
	// Open browser
	openBrowser('http://localhost:4000');
});
