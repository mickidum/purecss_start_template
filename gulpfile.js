var gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		gulpSass       = require('gulp-sass'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		rename         = require('gulp-rename'),
		gulpImagemin   = require('gulp-imagemin'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		ftp            = require('vinyl-ftp'),
		notify         = require("gulp-notify");
		rimraf         = require("rimraf");

var pureCssPaths = [
  'app/libs/purecss/pure-min.css',
  'app/libs/purecss/grids-responsive-min.css',
  'app/libs/sweetalert2/dist/sweetalert2.min.css'
];

function commonJs(cb) {
	gulp.src([
		'app/js/common.js',
		])
	.pipe(concat('common.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({stream: true}));
	cb();
}

function js(cb) {
	gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/libs/sweetalert2/dist/sweetalert2.min.js',
		// 'app/js/common.min.js', 
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({stream: true}));
	cb();
}

function browser(cb) {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
	cb();
}

function code(cb) {
	gulp.src('app/*.html')
	.pipe(browserSync.reload({ stream: true }));
	cb();
}

function sass(cb) {
	gulp.src('app/scss/**/*.scss')
	.pipe(gulpSass({
		includePaths: pureCssPaths,
		outputStyle: 'expand'}).on("error", notify.onError()))
	.pipe(rename({suffix: '.min', prefix : ''}))
	.pipe(autoprefixer(['last 2 versions']))
	.pipe(cleanCSS()) // comment on debug
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}));
	cb();
}

function watch(cb) {
	gulp.watch('app/scss/**/*.scss', gulp.parallel(sass));
	gulp.watch('libs/**/*.js', gulp.parallel(js));
	gulp.watch('app/js/common.js', gulp.parallel(commonJs));
	gulp.watch('app/*.html', gulp.parallel(code));
	cb();
}
	

function imagemin(cb) {
	gulp.src('app/img/**/*')
	.pipe(cache(gulpImagemin()))
	.pipe(gulp.dest('dist/img')); 
	cb();
}

function deploy(cb) {
	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));
	cb();
}

function files(cb) {
	var buildFiles = gulp.src([
		'app/*.html',
		'app/.htaccess',
		],{allowEmpty: true}).pipe(gulp.dest('dist'));

	var buildCss = gulp.src([
		'app/css/app.min.css',
		]).pipe(gulp.dest('dist/css'));

	var buildJs = gulp.src([
		'app/js/scripts.min.js',
		'app/js/common.min.js',
		'app/js/common.js',
		],{allowEmpty: true}).pipe(gulp.dest('dist/js'));

	var buildApi = gulp.src([
		'app/api/**/*'
		],{allowEmpty: true}).pipe(gulp.dest('dist/api'));
	cb();
}

function remDist(cb) {
	rimraf('dist', cb);
}

function clearCache (cb) { 
	cache.clearAll();
	cb(); 
}

exports.build = gulp.series(remDist, gulp.parallel(imagemin, sass, js), files);
exports.clearcache = gulp.parallel(clearCache);
exports.default = gulp.parallel(watch, browser);
