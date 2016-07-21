// Contains all Cordova-related tasks

(function () {
    'use strict';

    function RegisterTasks(gulp, config) {
        var del = require('del'),
            sh = require('shelljs'),
            runSequence = require('run-sequence'),
            watch = require('gulp-watch'),
            batch = require('gulp-batch'),
            browserSync = require('browser-sync'),
            browserSyncConfigIos = require('../configs/bs.config.cordova.ios.js'),
            path = require('path'),
            tap = require('gulp-tap'),
            rename = require('gulp-rename'),
            count = require('gulp-count');

        gulp.task('[private-cordova]:clean', function () {
            return del([
                path.join(config.targets.cordovaFolder, 'hooks'),
                path.join(config.targets.cordovaFolder, 'platforms'),
                path.join(config.targets.cordovaFolder, 'plugins'),
                path.join(config.targets.cordovaFolder, 'resources'),
                path.join(config.targets.cordovaFolder, 'www')
            ], { force: true });
        });

        gulp.task('[private-cordova]:config-for-livereload', function () {
            gulp.src(path.join(config.source.files.cordovaFiles, 'config_livereload.xml'), { base: config.source.files.cordovaFiles })
                .pipe(rename('config.xml'))
                .pipe(gulp.dest(config.targets.cordovaFolder));
        });

        gulp.task('[private-cordova]:config-for-default', function () {
            gulp.src(path.join(config.source.files.cordovaFiles, 'config.xml'), { base: config.source.files.cordovaFiles })
                .pipe(gulp.dest(config.targets.cordovaFolder));
        });

        gulp.task('[private-cordova]:copy-source', function () {
            let files = path.join(config.targets.buildFolder, '**', '*.*');

            if (deltaFiles.length) {
                files = deltaFiles;
            }
            return copySources(files);
        });

        function copySources(files) {
            return gulp.src(files, { base: config.targets.buildFolder })
                .pipe(gulp.dest(path.join(config.targets.cordovaFolder, 'www')))
                .pipe(count('Copied ## files to Cordova www folder'));
        }

        gulp.task('[private-cordova]:start-browser-sync:ios', function () {
            browserSync.init(browserSyncConfigIos);
        });
        let deltaFiles = [];

        function fillFilePathArray(target, source) {
            let file;
            while (file = source.read()) {
                target.push(file.path);
            }
        }

        gulp.task('watch-cordova-ios', ['[private-cordova]:start-browser-sync:ios'], function () {
            runSequence('[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-livereload',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:ios');

            watch(path.join(config.targets.buildFolder, '**', '*'), { base: config.targets.buildFolder }, batch(function (events, done) {
                deltaFiles.length = 0;
                fillFilePathArray(deltaFiles, events);
                runSequence('[private-cordova]:copy-source', function () {
                    browserSync.reload();
                    var currentDir = sh.pwd();
                    sh.cd(path.join(__dirname, '..', config.targets.cordovaFolder));
                    sh.exec('cordova prepare ios');
                    sh.cd(currentDir);
                    done();
                });
            }));
        });

        gulp.task('[private-cordova]:build:ios', function (done) {
            var currentDir = sh.pwd();
            sh.cd(config.targets.cordovaFolder);
            sh.exec('cordova prepare ios');
            sh.exec('../../node_modules/.bin/cordova-splash');
            sh.exec('../../node_modules/.bin/cordova-icon');
            sh.exec('cordova build ios');
            sh.cd(currentDir);
            done();
        });

        gulp.task('[private-cordova]:build:android', function (done) {
            var currentDir = sh.pwd();
            sh.cd(config.targets.cordovaFolder);
            sh.exec('cordova prepare android');
            sh.exec('../../node_modules/.bin/cordova-splash');
            sh.exec('../../node_modules/.bin/cordova-icon');
            sh.exec('cordova build android');
            sh.cd(currentDir);
            done();
        });

        gulp.task('[private-cordova]:build:windows', function (done) {
            var currentDir = sh.pwd();
            sh.cd(config.targets.cordovaFolder);
            sh.exec('cordova prepare windows');
            sh.exec('../../node_modules/.bin/cordova-splash');
            sh.exec('../../node_modules/.bin/cordova-icon');
            sh.exec('cordova build windows');
            sh.cd(currentDir);
            done();
        });

        gulp.task('[private-cordova]:build:all', function (done) {
            var currentDir = sh.pwd();
            sh.cd(config.targets.cordovaFolder);
            sh.exec('cordova prepare');
            sh.exec('../../node_modules/.bin/cordova-splash');
            sh.exec('../../node_modules/.bin/cordova-icon');
            sh.exec('cordova build');
            sh.cd(currentDir);
            done();
        });

        gulp.task('[private-cordova]:copy:resources', function () {
            return gulp.src(path.join(config.targets.resourcesFolder, '*.png'))
                .pipe(gulp.dest(config.targets.cordovaFolder));
        });

        gulp.task('[private-cordova]:copy:hooks', function () {
            return gulp.src(path.join(config.targets.hooksFolder, '**/*'))
                .pipe(gulp.dest(path.join(config.targets.cordovaFolder, 'hooks')));
        });

        gulp.task('[private-cordova]:default:ios', function (done) {
            runSequence(
                '[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-default',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:ios',
                done
            );
        });

        gulp.task('[private-cordova]:remove-fake-script', function () {
            return del(path.join(config.targets.cordovaFolder, 'www', 'cordova.js'));
        });

        gulp.task('[private-cordova]:build-only', function (done) {
            var currentDir = sh.pwd();
            sh.cd(config.targets.cordovaFolder);
            sh.exec('cordova build ios');
            sh.cd(currentDir);
            done();
        });

        gulp.task('rebuild-cordova', function (done) {
            runSequence('build-web', '[private-cordova]:copy-source', '[private-cordova]:remove-fake-script', '[private-cordova]:build-only', done);
        });

        gulp.task('build-cordova', function (done) {
            runSequence(
                'build-web',
                '[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-default',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:all',
                done
            );
        });

        gulp.task('build-cordova-ios', function (done) {
            runSequence(
                'build-web',
                '[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-default',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:ios',
                done
            );
        });

        gulp.task('build-cordova-android', function (done) {
            runSequence(
                'build-web',
                '[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-default',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:android',
                done
            );
        });

        gulp.task('build-cordova-windows', function (done) {
            runSequence(
                'build-web',
                '[private-cordova]:clean',
                '[private-cordova]:copy-source',
                '[private-cordova]:remove-fake-script',
                '[private-cordova]:config-for-default',
                '[private-cordova]:copy:resources',
                '[private-cordova]:copy:hooks',
                '[private-cordova]:build:windows',
                done
            );
        });
    }

    module.exports = {
        init: RegisterTasks
    };
})();
