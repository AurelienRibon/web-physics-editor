"use strict;"

var Models = Models || {};

// -----------------------------------------------------------------------------
// SHAPES
// -----------------------------------------------------------------------------

Models.PolygonShape = function() {
    this.points = [];
    this.isClosed = false;
};

Models.CircleShape = function() {
    this.center = {x: 0, y: 0};
    this.radius = 0;
    this.isClosed = false;
}
