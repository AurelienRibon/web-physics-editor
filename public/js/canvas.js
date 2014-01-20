'use strict';

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

    // Define stage, layer and groups
    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});
    this.layer = new Kinetic.Layer();

    this.groups = {
        background: new Kinetic.Group(),
        image: new Kinetic.Group({opacity: 0.3}),
        circles: new Kinetic.Group(),
        innerLines: new Kinetic.Group(),
        outerLines: new Kinetic.Group(),
        points: new Kinetic.Group(),
        foreground: new Kinetic.Group()
    };

    _(this.groups).forOwn(function(i, k) {
        that.layer.add(that.groups[k]);
    });

    // Add image group to background and define a bg rectangle for event
    // interception.
    this.groups.background.add(this.groups.image);
    this.groups.background.add(new Kinetic.Rect( _.merge({width: w, height: h}, Canvas.BackStyle)));

    // Register mousedown event on background instead of stage, so clicks
    // won't interfere with event listeners registered on individual nodes.
    this.groups.background.on('mousedown', function(e) {
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

    // Update all
    this.stage.add(this.layer);
};

// -----------------------------------------------------------------------------
// API for image
// -----------------------------------------------------------------------------

Canvas.prototype.setImage = function(src) {
    var image = new Kinetic.Image({image: src, opacity: 0});
    this.groups.image.destroyChildren();
    this.groups.image.add(image);
    this.animateFadeIn(image);
    this.draw();
};

// -----------------------------------------------------------------------------
// API for selection
// -----------------------------------------------------------------------------

Canvas.prototype.startSelection = function(x, y) {
    this.endSelection();
    this.selectionRect = new Kinetic.Rect(Canvas.SelectionRectStyle);
    this.selectionRect.position({x: x, y: y});
    this.selectionRect.listening(false);
    this.groups.foreground.add(this.selectionRect);
    this.draw();
};

Canvas.prototype.updateSelectionRect = function(x, y) {
    if (!this.selectionRect) return;

    this.selectionRect.width(x - this.selectionRect.position().x);
    this.selectionRect.height(y - this.selectionRect.position().y);
    this.draw();
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

    this.selectionRect.destroy();
    this.selectionRect = null;
    this.draw();
};

// -----------------------------------------------------------------------------
// API for misc tasks
// -----------------------------------------------------------------------------

Canvas.prototype.changeMode = function(mode) {
    this.endSelection();
    this.cancelCurrentShape();
    this.mode = mode;
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
    this.draw();
};

Canvas.prototype.valign = function() {
    if (this.selectedPoints.length < 2) return;

    var that = this;
    var x = this.selectedPoints[0].position().x;

    _(this.selectedPoints).forEach(function(p) {
        that.movePolygonPoint(p, {x: x});
    });

    this.draw();
};

Canvas.prototype.halign = function() {
    if (this.selectedPoints.length < 2) return;

    var that = this;
    var y = this.selectedPoints[0].position().y;

    _(this.selectedPoints).forEach(function(p) {
        that.movePolygonPoint(p, {y: y});
    });

    this.draw();
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

Canvas.prototype.cancelCurrentShape = function() {
    if (!this.shape) return;

    if (this.shape.type == 'polygon') {
        for (var i=0; i<this.shape.points.length; i++) {
            this.shape.points[i].nextLine.destroy();
            this.shape.points[i].destroy();
        }
    }

    if (this.shape.type == 'circle') {
        this.shape.center.destroy();
        this.shape.circle.destroy();
    }

    this.shape = null;
    this.draw();
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

Canvas.prototype.draw = function() {
    this.layer.draw();
};
