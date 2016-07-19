/**
 * System configuration for Angular 2.
 */
(function (global) {
    // map tells the System loader where to look for things
    var map = {
        'app': 'app', // 'dist',
        '@angular': '@angular',
        'rxjs': 'scripts/bundles',
        'jq': 'scripts/bundles/jquery-2.1.4.js',
        'bootstrap/js/bootstrap': 'scripts/bundles/bootstrap.js',
        'admin-lte/js/app': 'scripts/bundles/app.js',
        'jquery/jquery.hammer': 'scripts/bundles/jquery.hammer.js',
        'hammerjs': 'scripts/bundles/hammer.js',
        'hammerjs/hammer': 'scripts/bundles/hammer.js',
        'jquery/jquery.slimscroll': 'scripts/bundles/jquery.slimscroll.js',
        'pnotify': 'scripts/bundles/pnotify.custom.js',
        'pNotify/pnotify-adapter': 'scripts/bundles/pnotify-adapter.js',
        'signalr/signalr': 'scripts/bundles/signalr.js',
        'leaflet/leaflet': 'scripts/bundles/leaflet-src.js',
        'fastclick/fastclick': 'scripts/bundles/fastclick.js'
    };
    // packages tells the System loader how to load when no filename and/or no extension
    var packages = {
        'app': { main: 'main.js', defaultExtension: 'js' },
        'rxjs': {main:'Rx.js', defaultExtension: 'js'},
        '@angular/common': { main: 'bundles/common.umd.js', defaultExtension: 'js' },
        '@angular/compiler': { main: 'bundles/compiler.umd.js', defaultExtension: 'js' },
        '@angular/core': { main: 'bundles/core.umd.js', defaultExtension: 'js' },
        '@angular/http': { main: 'bundles/http.umd.js', defaultExtension: 'js' },
        '@angular/platform-browser': { main: 'bundles/platform-browser.umd.js', defaultExtension: 'js' },
        '@angular/platform-browser-dynamic': { main: 'bundles/platform-browser-dynamic.umd.js', defaultExtension: 'js' },
        '@angular/router-deprecated': { main: 'bundles/router-deprecated.umd.js', defaultExtension: 'js' },
    };

    var config = {
        map: map,
        packages: packages
    };
    System.config(config);
})(this);

function backupModule() {
    return new Promise(function (resolve, reject) {
        if(typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
            window.module = module;
            module = undefined;
        }
        resolve(true);
    });
}

function restoreModule() {
    return new Promise(function (resolve, reject) {
        if(window.hasOwnProperty('module')) {
            module = window.module;
        }
        resolve(true);
    });
}

backupModule()
    .then(function () {
        return System.import('jq');
    })
    .then(function () {
        return restoreModule();
    })
    .then(function () {
        return System.import('rxjs');
    }).then(function () {
        return System.import('app/main');
    })
    .then(null, console.error.bind(console));

