"use strict;"

var app = angular.module('bodyeditor', []);

app.controller('Controller', function($scope) {
    $scope.canvas = null;
    $scope.shapeMode = 'polygon';
});

app.directive('isCanvas', function() {
    return function(scope, elem, attrs) {
        elem.attr('id', 'canvas');
        scope.canvas = new Canvas(elem.width(), elem.height());

        $(window).on('keydown', function(e) {
            if (e.keyCode == 9) {
                e.preventDefault();
                scope.shapeMode = 'circle';
            }

            if (e.keyCode == 16) {
                e.preventDefault();
                scope.canvas.changeMode('create' + scope.shapeMode);
            }

            if (e.keyCode == 8 || e.keyCode == 46) {
                e.preventDefault();
                scope.canvas.delete();
            }
        });

        $(window).on('keyup', function(e) {
            if (e.keyCode == 16) {
                e.preventDefault();
                scope.canvas.changeMode('edit');
            }
        });
    };
});