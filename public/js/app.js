"use strict;"

var app = angular.module('bodyeditor', []);

app.controller('Controller', function($scope) {
    $scope.canvas = null;
});

app.directive('isCanvas', function() {
    return function(scope, elem, attrs) {
        elem.attr('id', 'canvas');
        scope.canvas = new Canvas(elem.width(), elem.height());
    };
});