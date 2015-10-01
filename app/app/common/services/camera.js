!function ($, jQuery, window, document) {
    'use strict';

    /**
     * @ngdoc service
     * @public
     * @param $window
     * @param $document
     * @param $q
     * @param {PlatformInformation} platformInformation
     */
    function Camera($window, $document, $q, platformInformation) {
        function getMediaDevices() {
            var mediaDevices = $window.navigator.mediaDevices || (($window.navigator.mozGetUserMedia || $window.navigator.webkitGetUserMedia) ? {
                    getUserMedia: function (options) {
                        var defer = $q.defer();
                        ($window.navigator.mozGetUserMedia ||
                        $window.navigator.webkitGetUserMedia).call($window.navigator, options, defer.resolve, defer.reject);
                        return defer.promise;
                    }
                } : null);

            return mediaDevices;
        }

        function takePhoto() {
            var defer = $q.defer();

            if ($window.navigator) {
                var mediaDevices = getMediaDevices();

                if (!mediaDevices.getUserMedia) {
                    defer.reject('Platform does not support getUserMedia-API');
                }

                mediaDevices.getUserMedia({ video: true, audio: false })
                    .then(function (stream) {
                        try {
                            var vendorURL = $window.URL || $window.webkitURL;
                            var doc = $document[0];
                            var videoElement = doc.createElement('video');
                            videoElement.src = vendorURL.createObjectURL(stream);
                            videoElement.play();

                            var canvasElement = doc.createElement('canvas');
                            canvasElement.setAttribute('width', videoElement.videoWidth);
                            canvasElement.setAttribute('height', videoElement.videoHeight);

                            var context = canvasElement.getContext('2d');
                            context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);

                            var url = canvasElement.toDataURL('image/png');
                            return url;
                        }
                        catch (e) {
                            defer.reject(e);
                        }
                    }, defer.reject);
            }
            else {
                defer.reject('Platform does not support getUserMedia-API');
            }

            return defer.promise;
        }

        this.takePhoto = function () {
            if (platformInformation.isCordova()) {
                return takeCordovaPhoto();
            }

            return takePhoto();
        };
    }

    app.module.service('camera', Camera);
}();