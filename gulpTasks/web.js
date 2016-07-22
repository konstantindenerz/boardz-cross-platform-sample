// Contains everything to develop BoardZ! using a Browsersync

(function () {
    'use strict';

    function RegisterTasks(gulp, config) {
        var del = require('del'),
            path = require('path'),
            runSequence = require('run-sequence'),
            browserSync = require('browser-sync').create(),
            browserSyncConfig = require('../configs/bs.config'),
            watch = require('gulp-watch'),
            batch = require('gulp-batch'),
            cleanCss = require('gulp-clean-css'),
            filelog = require('gulp-filelog'),
            concat = require('gulp-concat'),
            ts = require('gulp-typescript'),
            tsConfig = ts.createProject(config.ts.config),
            sourcemaps = require('gulp-sourcemaps'),
            rename = require('gulp-rename'),
            inject = require('gulp-inject'),
            uglify = require('gulp-uglify'),
            watch = require('gulp-watch'),
            Builder = require('systemjs-builder'),
            count = require('gulp-count'),
            embedTemplates = require('gulp-angular2-embed-templates'),
            replaceExt = require('replace-ext');

        gulp.task('[private-web]:copy-template', function () {
            var sources = gulp.src(config.source.files.injectables);

            return gulp.src(config.source.files.main)
                .pipe(inject(sources, { addRootSlash: false, ignorePath: 'dist/www' }))
                .pipe(gulp.dest(path.join(config.targets.buildFolder)));
        });

        gulp.task('[private-web]:bundle-vendor-scripts', function () {
            var builder = new Builder();
            gulp.src(config.source.files.angular2rc1deps)
                .pipe(gulp.dest(path.join(config.targets.buildFolder, 'scripts')));

            return builder.loadConfig(config.systemJsConfig)
                .then(function () {
                    var promises = [];

                    config.source.files.vendorJs.forEach(function (jsFile) {
                        promises.push(builder.bundle(jsFile, path.join(config.targets.buildFolder, 'scripts/bundles', path.basename(jsFile))));
                    });

                    return Promise.all(promises);
                })
        });

        gulp.task('[private-web]:bundle-angular2-scripts', function () {
            return gulp.src('./node_modules/@angular/**/*.umd.js')
                .pipe(gulp.dest(path.join(config.targets.buildFolder, '@angular')));
        });

        gulp.task('[private-web]:bundle-rxjs-scripts', function () {
            const builder = new Builder({
                baseURL: 'node_modules',
                packages: {
                    'rxjs': { main: 'Rx', defaultExtension: 'js' }
                }
            });
            return builder.bundle('rxjs', path.join(config.targets.buildFolder, 'scripts/bundles', 'Rx.js'));
        });

        gulp.task('[private-web]:copy-system-setup-script', function () {
            return gulp.src(config.source.files.systemSetupScript)
                .pipe(uglify())
                .pipe(gulp.dest(path.join(config.targets.buildFolder, 'scripts/')));
        });

        gulp.task('[private-web]:copy-cordova-script', function () {
            return gulp.src(config.source.files.cordova)
                .pipe(gulp.dest(path.join(config.targets.buildFolder)));
        });

        gulp.task('[private-web]:copy-system', function () {
            return gulp.src(config.source.files.systemJs)
                .pipe(uglify())
                .pipe(rename(config.targets.systemMinJs))
                .pipe(gulp.dest(path.join(config.targets.buildFolder, 'scripts/')))
        });

        gulp.task('[private-web]:copy-fonts', function () {
            return gulp.src(config.source.files.vendorFonts)
                .pipe(gulp.dest(path.join(config.targets.buildFolder, 'fonts')));
        });

        gulp.task('[private-web]:copy-app-assets', function () {
            return gulp.src(config.source.files.app.assets)
                .pipe(gulp.dest(path.join(config.targets.buildFolder, config.targets.appFolder)));
        });

        gulp.task('[private-web]:vendor-css', function () {
            return gulp.src(config.source.files.vendorStylesheets)
                .pipe(concat(config.targets.vendorMinCss))
                .pipe(cleanCss())
                .pipe(gulp.dest(path.join(config.targets.buildFolder, config.targets.stylesFolder)))
                .pipe(browserSync.stream());
        });

        gulp.task('[private-web]:copy-app-styles', function () {
            return gulp.src(config.source.files.app.css)
                .pipe(cleanCss())
                .pipe(gulp.dest(path.join(config.targets.buildFolder, config.targets.stylesFolder)))
                .pipe(browserSync.stream());
        });

        gulp.task('[private-web]:copy-component-styles', function () {
            return gulp.src(config.source.files.app.componentCss)
                .pipe(cleanCss())
                .pipe(gulp.dest(path.join(config.targets.buildFolder, config.targets.appFolder)))
                .pipe(browserSync.stream());
        });

        let tsDeltaFiles = [];
        gulp.task('[private-web]:build-app-scripts', function () {
            let files = config.source.files.app.ts;
            if (tsDeltaFiles.length) {
                files = tsDeltaFiles;
            }
            return transpileTypeScript(files);
        });

        function transpileTypeScript(files) {
            return gulp.src(files, { base: config.source.folder })
                .pipe(sourcemaps.init())
                .pipe(embedTemplates({
                    sourceType: 'ts',
                    minimize: {
                        empty: true,
                        cdata: true,
                        comments: true,
                        spare: true,
                        quotes: true
                    }
                }))
                .pipe(ts(tsConfig))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(config.targets.buildFolder))
                .pipe(count('Generated ## JS files'));
        }

        gulp.task('[private-web]:watch:no-browser-sync', function () {
            return deltaWatch();
        });


        gulp.task('build-web', function (done) {
            return runSequence(
                'clean',
                [
                    '[private-web]:bundle-vendor-scripts',
                    '[private-web]:bundle-angular2-scripts',
                    '[private-web]:bundle-rxjs-scripts',
                    '[private-web]:copy-system-setup-script',
                    '[private-web]:copy-cordova-script',
                    '[private-web]:copy-system',
                    '[private-web]:build-app-scripts',
                    '[private-web]:vendor-css',
                    '[private-web]:copy-fonts',
                    '[private-web]:copy-app-styles',
                    '[private-web]:copy-component-styles',
                    '[private-web]:copy-app-assets'
                ],
                '[private-web]:copy-template',
                done
            );
        });

        gulp.task('[private-web]:start-browser-sync', ['build-web'], function () {
            browserSync.init(browserSyncConfig);
        });

        gulp.task('[private-web]:browser-sync-reload', function (done) {
            browserSync.reload();
            done();
        });

        gulp.task('watch-web', ['[private-web]:start-browser-sync'], function () {
            deltaWatch();
        });

        /**
         * @param {Array} target
         * @param {StreamArray} source
         */
        function fillFilePathArray(target, source, pathProcessor) {
            let file;
            while (file = source.read()) {
                let path = file.path;
                if (pathProcessor) {
                    path = pathProcessor(path);
                }
                target.push(path);
            }
        }

        function deltaWatch() {
            gulp.watch(config.source.files.app.css, ['[private-web]:copy-app-styles']);
            gulp.watch(config.source.files.app.componentCss, ['[private-web]:copy-component-styles']);
            gulp.watch(config.source.files.vendorStylesheets, ['[private-web]:vendor-css']);

            gulp.watch(config.source.files.app.ts, batch(function (fileStreamArray, done) {
                tsDeltaFiles.length = 0;
                fillFilePathArray(tsDeltaFiles, fileStreamArray);
                runSequence('[private-web]:build-app-scripts', '[private-web]:browser-sync-reload', done);
            }));

            gulp.watch(config.source.files.app.html, batch(function (fileStreamArray, done) {
                tsDeltaFiles.length = 0;
                fillFilePathArray(tsDeltaFiles, fileStreamArray, (path) => replaceExt(path, '.ts'));
                runSequence('[private-web]:build-app-scripts', '[private-web]:browser-sync-reload', done);
            }));

            gulp.watch(config.source.files.systemSetupScript, ['[private-web]:copy-system-setup-script', '[private-web]:browser-sync-reload']);
            gulp.watch(config.source.files.main, ['[private-web]:copy-template', '[private-web]:browser-sync-reload']);
        }
    }

    module.exports = {
        init: RegisterTasks
    };
})();
