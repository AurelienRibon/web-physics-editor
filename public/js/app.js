'use strict';

var app = angular.module('bodyeditor', []);

app.controller('Controller', function($scope) {
    $scope.canvas = null;
});

app.directive('isCanvas', function() {
    return function(scope, elem, attrs) {
        elem.attr('id', 'canvas');
        scope.canvas = new Canvas(elem.width(), elem.height());

        $(window).on('keyup', function(e) {
            /* E */ if (e.keyCode == 69) scope.canvas.changeMode('edit');
            /* R */ if (e.keyCode == 82) scope.canvas.changeMode('createpolygon');
            /* T */ if (e.keyCode == 84) scope.canvas.changeMode('createcircle');

            // BACK or DEL
            if (e.keyCode == 8 || e.keyCode == 46) {
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
        });
    };
});

app.directive('noFocus', function() {
    return function(scope, elem, attrs) {
        elem.on('mouseup', function(e) {
            this.blur();
        });
    };
});