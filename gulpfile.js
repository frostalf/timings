/*
 * Aikar's Minecraft Timings Parser
 *
 * Written by Aikar <aikar@aikar.co>
 * http://aikar.co
 * http://starlis.com
 *
 * @license MIT
 */
var gulp = require('gulp');
var runSeq = require('run-sequence').use(gulp);
require('gulp-bash-completion')(gulp);
var $ = require('gulp-load-plugins')();
var $u = require('./gulp.util');

var autoprefixer = require('autoprefixer');
var postcssurl = require("postcss-url");
var postcss = require('gulp-postcss');
var csswring = require('csswring');
var mqpacker = require('css-mqpacker');
var bless = require('gulp-bless');
var shell = require("gulp-shell");

var dir = __dirname;
var paths = {};




paths.static = `${dir}/static`;
paths.vendorjs = [`${dir}/vendor/js/**.js`];
paths.js = [`${paths.static}/js/**.js`];
paths.dart = [`${paths.static}/dart/timings.dart`];
paths.dart_watch = [`${paths.static}/dart/**.dart`];
// Files to watch for CSS change, but we have a single entry point
paths.css_watch = [`${paths.static}/css/**.scss`];
paths.css_entryfile = `${paths.static}/css/timings.scss`;
paths.dist = `${paths.static}/dist`;

gulp.task('vendor', () => {
	return gulp.src(paths.vendorjs)
		 .pipe($.uglify({mangle: false}))
		 .pipe($.concat('vendor.js'))
		 .pipe(gulp.dest(paths.dist))
		;
});

gulp.task('js', () => {
	return gulp.src(paths.js)
		.pipe($.babel())
		.pipe($.uglify())
		.pipe($.concat('timings.js'))
		.pipe($u.wrapJS())
		.pipe(gulp.dest(paths.dist))
		;
});

gulp.task('dart-prep', shell.task([
	"if [ ! -f .packages ]; then pub get && rm -rf packages/ && find -xtype l -delete; fi"
]));

gulp.task('dart', ['dart-prep'], shell.task([
	`mkdir -p ${paths.dist} ${dir}/build`,
	`dart2js -o ${dir}/build/timings.js -m -c --packages=${dir}/.packages ${paths.dart}`,
	`cp ${dir}/build/timings.js ${paths.dist}/timings.js`
]));

gulp.task('css', () => {
	var processors = [
		autoprefixer({browsers: ['last 2 versions', 'IE 9', 'IE 10']}),
		postcssurl({url: "rebase"}),
		mqpacker,
		csswring({preserveHacks: true})
	];
	
	return gulp.src(paths.css_entryfile)
		.pipe($.sass({
			outputStyle: 'nested',
			errLogToConsole: true
		}))
		.pipe(postcss(processors, {
			to: `${paths.dist}/timings.css`
		}))
		.pipe($.concat('timings.css'))
		.pipe(bless())
		.pipe(gulp.dest(paths.dist));
});

gulp.task('build', ['vendor', 'js', 'css']);
gulp.task('builddart', ['vendor', 'dart', 'css']);

gulp.task('default', ['build'], () => {
	$.watch(paths.js,  () => $u.scheduleTask('js', 1500));
	$.watch(paths.css_watch, () => $u.scheduleTask('css', 1500));
	$.watch(paths.dart_watch, () => $u.scheduleTask('dart', 1500));
	setImmediate(() => {
		$.util.log('================================================================');
		$.util.log('===================== NOW MONITORING FILES =====================');
		$.util.log('================== PRESS CONTROL + C TO ABORT ==================');
		$.util.log('================================================================');
	});
});
