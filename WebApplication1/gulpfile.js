/// <vs BeforeBuild='clean' AfterBuild='styles, scripts' />
// http://markgoodyear.com/2014/01/getting-started-with-gulp/

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var minifycss = require('gulp-minify-css');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var notify = require('gulp-notify');
var cache = require('gulp-cache');
//var livereload = require('gulp-livereload');
var del = require('del');
var rjs = require('gulp-requirejs');

gulp.task('styles', function () {
	return gulp.src('Content/Styles.css')
	  //.pipe(sass({ style: 'expanded' }))
	  .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
	  .pipe(gulp.dest('dist/assets/css'))
	  .pipe(rename({ suffix: '.min' }))
	  .pipe(minifycss())
	  .pipe(gulp.dest('dist/assets/css'))
	  .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('scripts', function () {
	return rjs({
		baseUrl: "Scripts/",
		exclude: ["jquery", "knockout", "grapnel"],
		mainConfigFile: "Scripts/Main.js",
		name: "Main",
		inlineText: true,
		findNestedDependencies: true,
		out: "main.js",
	})
        .pipe(gulp.dest('dist/assets/js')) // pipe it to the output DIR
		.pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
        .pipe(gulp.dest('dist/assets/js')) // pipe it to the output DIR
		.pipe(notify({ message: 'Scripts task complete' }));
});

//gulp.task('images', function () {
//	return gulp.src('images/**/*')
//	  .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
//	  .pipe(gulp.dest('dist/assets/img'))
//	  .pipe(notify({ message: 'Images task complete' }));
//});


gulp.task('clean', function (cb) {
	del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img'], cb)
});


gulp.task('default', ['clean'], function () {
	gulp.start('styles', 'scripts', 'images');
});


//gulp.task('watch', function () {

//	// Watch .scss files
//	gulp.watch('src/styles/**/*.scss', ['styles']);

//	// Watch .js files
//	gulp.watch('src/scripts/**/*.js', ['scripts']);

//	// Watch image files
//	gulp.watch('src/images/**/*', ['images']);

//});