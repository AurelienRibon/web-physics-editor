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

app.directive('noFocus', function() {
    return function(scope, elem, attrs) {
        elem.on('mouseup', function() {
            this.blur();
        });
    };
});