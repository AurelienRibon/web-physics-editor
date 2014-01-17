"use strict;"

function log(str) {
    if (console && console.log) {
        console.log(str);
    }
}

// -----------------------------------------------------------------------------
// CONSTRUCTOR
// -----------------------------------------------------------------------------

var Canvas = function(w, h) {
    var that = this;

    // Define general properties
    this.mode = 'edit';
    this.shapes = [];
    this.shape = null;
    this.selectionRect = null;
    this.selectedPoints = [];

    // Define stage properties
    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});
    this.backLayer = new Kinetic.Layer();
    this.linesLayer = new Kinetic.Layer();
    this.pointsLayer = new Kinetic.Layer();
    this.frontLayer = new Kinetic.Layer();

    // Add background for event interception
    this.backLayer.add(new Kinetic.Rect( _.merge({width: w, height: h}, Canvas.BackStyle)));

    // Add layers to stage
    this.stage.add(this.backLayer);
    this.stage.add(this.linesLayer);
    this.stage.add(this.pointsLayer);
    this.stage.add(this.frontLayer);

    // Register mousedown event on back layer instead of stage, so clicks
    // won't interfere with event listeners registered on individual nodes.
    this.backLayer.on('mousedown', function(e) {
        if (that.mode == 'createpolygon') that.startPolygonShape(e.offsetX, e.offsetY);
        if (that.mode == 'createcircle') that.startCircleShape(e.offsetX, e.offsetY);
        if (that.mode == 'edit') that.startSelection(e.offsetX, e.offsetY);
    });

    // Register mousemove event directly on stage, so we are always notified 
    // of a move, no matter what. This notification is used to update the
    // drawings.
    this.stage.on('mousemove', function(e) {
        if (that.mode == 'createpolygon') that.updatePolygonShape(e.offsetX, e.offsetY);
        if (that.mode == 'createcircle') that.updateCircleShape(e.offsetX, e.offsetY);
        if (that.mode == 'edit') that.updateSelectionRect(e.offsetX, e.offsetY);
    });

    // Register mouseup event on stage too, since we cannot miss such event,
    // else the selection rectangle will never be removed for example.
    this.stage.on('mouseup', function(e) {
        if (that.mode == 'edit' && that.selectionRect) {
            that.updateSelectionRect(e.offsetX, e.offsetY);
            that.endSelection();
        }
    });
};

// -----------------------------------------------------------------------------
// API for circle shapes
// -----------------------------------------------------------------------------

Canvas.prototype.startCircleShape = function(x, y) {
    var that = this;

    if (this.shape == null) {
        this.shape = {type: 'circle', circle: null};

        var circle = new Kinetic.Circle(Canvas.CircleStyle);
        circle.position({x: x, y: y});
        circle.listening(false);

        this.shape.circle = circle;
        this.pointsLayer.add(circle);
        this.pointsLayer.draw();

    } else {
        this.updateCircleShape(x, y);
        that.shapes.push(that.shape);
        this.shape = null;
        this.mode = 'edit';
    }
};

Canvas.prototype.updateCircleShape = function(x, y) {
    if (!this.shape) return;

    var dx = Math.abs(this.shape.circle.position().x - x);
    var dy = Math.abs(this.shape.circle.position().y - y);
    this.shape.circle.radius(Math.sqrt(dx*dx + dy*dy));
    this.pointsLayer.draw();
};

// -----------------------------------------------------------------------------
// API for selection
// -----------------------------------------------------------------------------

Canvas.prototype.startSelection = function(x, y) {
    this.endSelection();
    this.selectionRect = new Kinetic.Rect(Canvas.SelectionRectStyle);
    this.selectionRect.position({x: x, y: y});
    this.selectionRect.listening(false);
    this.frontLayer.add(this.selectionRect);
    this.frontLayer.draw();
};

Canvas.prototype.updateSelectionRect = function(x, y) {
    if (!this.selectionRect) return;

    this.selectionRect.width(x - this.selectionRect.position().x);
    this.selectionRect.height(y - this.selectionRect.position().y);
    this.frontLayer.draw();
};

Canvas.prototype.endSelection = function() {
    this.selectedPoints = [];
    this.selectionRect = this.selectionRect || new Kinetic.Rect();

    var that = this;
    var r = this.selectionRect;
    var x = Math.min(r.position().x, r.position().x + r.width());
    var y = Math.min(r.position().y, r.position().y + r.height());
    var w = Math.abs(r.width());
    var h = Math.abs(r.height());

    _(this.shapes).forEach(function(shape) {
        if (shape.type == 'polygon') {
            _(shape.points).forEach(function(p) {
                p.setAttrs(Canvas.PointStyle);
                var px = p.position().x;
                var py = p.position().y;
                if (x <= px && px <= x + w && y <= py && py <= y + h) {
                    p.setAttrs(Canvas.PointSelectedStyle);
                    that.selectedPoints.push(p);
                }
            });
        }
    });

    this.selectionRect.remove();
    this.selectionRect = null;
    this.frontLayer.draw();
    this.pointsLayer.draw();
};

// -----------------------------------------------------------------------------
// API for misc tasks
// -----------------------------------------------------------------------------

Canvas.prototype.changeMode = function(mode) {
    if (!this.shape) {
        this.mode = mode;
    }
};

Canvas.prototype.delete = function() {
    var that = this;

    _(this.selectedPoints).forEachRight(function(p) {
        that.clearPolygonPoint(p);
    });

    _(this.shapes).forEach(function(shape) {
        that.linkPolygonShape(shape);
    });

    this.selectedPoints = [];
    this.pointsLayer.draw();
    this.linesLayer.draw();
};

Canvas.prototype.valign = function() {
    if (this.selectedPoints.length < 2) return;

    var that = this;
    var x = this.selectedPoints[0].position().x;

    _(this.selectedPoints).forEach(function(p) {
        that.updatePolygonPoint(p, {x: x});
    });

    this.pointsLayer.draw();
    this.linesLayer.draw();
};

Canvas.prototype.halign = function() {
    if (this.selectedPoints.length < 2) return;

    var that = this;
    var y = this.selectedPoints[0].position().y;

    _(this.selectedPoints).forEach(function(p) {
        that.updatePolygonPoint(p, {y: y});
    });

    this.pointsLayer.draw();
    this.linesLayer.draw();
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

Canvas.prototype.removeLastShape = function() {
    if (!this.shape) return;

    if (this.shape.type == 'polygon') {
        for (var i=0; i<this.shape.points.length; i++) {
            this.shape.points[i].nextLine.remove();
            this.shape.points[i].remove();
        }
    }

    if (this.shape.type == 'circle') {
        this.shape.center.remove();
        this.shape.circle.remove();
    }

    this.shape = null;
    this.pointsLayer.draw();
    this.linesLayer.draw();
};

Canvas.prototype.animateScaleIn = function(obj) {
    obj.setAttrs({scaleX: 0, scaleY: 0});
    var ease = Kinetic.Easings.BackEaseOut;
    new Kinetic.Tween({node: obj, duration: 0.5, easing: ease, scaleX: 1, scaleY: 1}).play();
};

Canvas.prototype.animateFadeIn = function(obj) {
    obj.setAttrs({opacity: 0});
    var ease = Kinetic.Easings.EaseInOut;
    new Kinetic.Tween({node: obj, duration: 0.5, easing: ease, opacity: 1}).play();
};
