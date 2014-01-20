'use strict';

var app = angular.module('bodyeditor', []);

// -----------------------------------------------------------------------------
// CONTROLLERS
// -----------------------------------------------------------------------------

app.controller('Controller', function($scope) {
    $scope.canvas = null;
});

// -----------------------------------------------------------------------------
// DIRECTIVES
// -----------------------------------------------------------------------------

app.directive('noFocus', function() {
    return function(scope, elem, attrs) {
        elem.on('mouseup', function(e) {
            this.blur();
        });
    };
});

app.directive('isCanvas', function() {
    return function(scope, elem, attrs) {
        elem.attr('id', 'canvas');
        scope.canvas = new Canvas(elem.width(), elem.height());

        $(window).on('keyup', function(e) {
            var keys = {ESC: 27, E: 69, R: 82, BACK: 8, DEL: 46};

            if (e.keyCode == keys.ESC) scope.canvas.changeMode('edit');
            if (e.keyCode == keys.E) scope.canvas.changeMode('createpolygon');
            if (e.keyCode == keys.R) scope.canvas.changeMode('createcircle');

            if (e.keyCode == keys.BACK || e.keyCode == keys.DEL) {
                e.preventDefault();
                scope.canvas.delete();
            }
        });
    };
});

app.directive('dragListener', function() {
    return function(scope, elem, attrs) {
        elem.on('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            $('.dropzone').addClass('shown');
        });

        elem.on('dragleave', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $('.dropzone').removeClass('shown');
        });

        elem.on('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $('.dropzone').removeClass('shown');

            for (var i=0, f; f=e.dataTransfer.files[i]; i++) {
                if (!f.type.match('image.*')) continue;
                var reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onloadend = function(e) {
                    var span = document.createElement('span');
                    var image = new Image();
                    image.src = e.target.result;
                    scope.canvas.setImage(image);
                };
            }
        });
    };
});