'use strict';

// -----------------------------------------------------------------------------
// CREATION
// -----------------------------------------------------------------------------

Canvas.prototype.startCircleShape = function(x, y) {
    var that = this;

    if (this.shape == null) {
        this.shape = {type: 'circle', circle: null};

        var circle = new Kinetic.Circle(Canvas.CircleStyle);
        circle.position({x: x, y: y});
        circle.listening(false);

        this.shape.circle = circle;
        this.layer.add(circle);
        this.draw();

    } else {
        this.updateCircleShape(x, y);
        that.shapes.push(that.shape);
        this.shape = null;
        this.mode = 'edit';
    }
};

// -----------------------------------------------------------------------------
// UPDATE
// -----------------------------------------------------------------------------

Canvas.prototype.updateCircleShape = function(x, y) {
    if (!this.shape) return;

    var dx = Math.abs(this.shape.circle.position().x - x);
    var dy = Math.abs(this.shape.circle.position().y - y);
    this.shape.circle.radius(Math.sqrt(dx*dx + dy*dy));
    this.draw();
};