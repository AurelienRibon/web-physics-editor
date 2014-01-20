'use strict';

var Models = Models || {};

// -----------------------------------------------------------------------------
// SHAPES
// -----------------------------------------------------------------------------

Models.Sprite = function() {
    this.polygonShapes = [];
    this.circleShapes = [];
};

Models.PolygonShape = function() {
    this.points = [];
};

Models.CircleShape = function() {
    this.center = {x: 0, y: 0};
    this.radius = 0;
}
