"use strict;"

// -----------------------------------------------------------------------------
// CONSTRUCTOR
// -----------------------------------------------------------------------------

var Canvas = function(w, h) {
    var that = this;

    // Define general properties
    this.mode = 'createpolygon';
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

    this.backLayer.on('mousedown', function(e) {
        if (that.mode == 'createpolygon') {
            that.addPolygonPoint(e.offsetX, e.offsetY);
        }

        if (that.mode == 'createcircle') {
            that.addCirclePoint(e.offsetX, e.offsetY);
        }

        if (that.mode == 'edit') {
            that.endSelection();
            that.selectionRect = new Kinetic.Rect(Canvas.SelectionRectStyle);
            that.selectionRect.position({x: e.offsetX, y: e.offsetY});
            that.selectionRect.listening(false);
            that.frontLayer.add(that.selectionRect);
            that.frontLayer.draw();
        }
    });

    this.stage.on('mousemove', function(e) {
        if (that.mode == 'createpolygon') that.updatePolygonShape(e.offsetX, e.offsetY);
        if (that.mode == 'edit') that.updateSelectionRect(e.offsetX, e.offsetY);
        if (that.mode == 'createcircle') that.updateCircleShape(e.offsetX, e.offsetY);
    });

    this.stage.on('mouseup', function(e) {
        if (that.mode == 'edit' && that.selectionRect) {
            that.updateSelectionRect(e.offsetX, e.offsetY);
            that.endSelection();
        }
    });
};

// -----------------------------------------------------------------------------
// API for shape management
// -----------------------------------------------------------------------------

Canvas.prototype.addPolygonPoint = function(x, y) {
    var that = this;

    // Create shape if needed.
    if (this.shape == null) {
        this.shape = {type: 'polygon', points: []};
    }

    // Update last line to end at new point.
    if (this.shape.points.length > 0) {
        var lastPoint = _.last(this.shape.points);
        this.updateLine(lastPoint, x, y);
        this.linesLayer.draw();
    }

    // Create new point with a line that will follow the mouse.
    this.createPolygonPoint(x, y);
};

Canvas.prototype.addCirclePoint = function(x, y) {
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
    }
};

Canvas.prototype.createPolygonPoint = function(x, y) {
    var line = this.createPolygonLine(x, y);

    var point = new Kinetic.Circle(Canvas.PointStyle);
    point.position({x: x, y: y});
    point.draggable(true);
    point.prevNode = _.last(this.shape.points);
    point.nextNode = null;
    point.prevLine = null;
    point.nextLine = line;

    if (point.prevNode) {
        point.prevNode.nextNode = point;
        point.prevLine = point.prevNode.nextLine;
    }

    this.shape.points.push(point);
    this.pointsLayer.add(point);
    this.animateScaleIn(point);

    this.registerPolygonPointEvents(point);
    if (!point.prevNode) this.registerFirstPolygonPointEvents(point);

    return point;
};

Canvas.prototype.createPolygonLine = function(x, y) {
    var line = new Kinetic.Line(Canvas.LineStyle);
    line.points([x, y, x, y]);
    line.listening(false);

    this.linesLayer.add(line);
    this.animateFadeIn(line);

    return line;
};

Canvas.prototype.registerPolygonPointEvents = function(point) {
    var that = this;
    var lastX, lastY;

    point.on('dragstart', function(e) {
        lastX = e.offsetX;
        lastY = e.offsetY;

        if (!_(that.selectedPoints).contains(point)) {
            that.endSelection();
        }
    });

    point.on('dragmove', function(e) {
        _(that.selectedPoints).forEach(function(p) {
            if (p != point) that.updatePoint(p, {
                dx: e.offsetX - lastX, 
                dy: e.offsetY - lastY
            });
        });

        that.updatePoint(point);
        that.pointsLayer.draw();
        that.linesLayer.draw();

        lastX = e.offsetX;
        lastY = e.offsetY;
    });
};

Canvas.prototype.registerFirstPolygonPointEvents = function(point) {
    var that = this;

    point.on('click', function(e) {
        if (that.shape.points.length < 3) return;

        var lastPoint = _.last(that.shape.points);
        point.prevNode = lastPoint;
        point.prevLine = lastPoint.nextLine;
        lastPoint.nextNode = point;
        that.updateLine(lastPoint);
        that.linesLayer.draw();

        point.fire('mouseleave');
        point.off('click mouseenter mouseleave');
        that.shapes.push(that.shape);
        that.shape = null;
    });

    point.on('mouseenter', function(e) {
        if (that.shape.points.length < 3) return;

        point.setAttrs(Canvas.PointOverStyle);
        that.pointsLayer.draw();
    });

    point.on('mouseleave', function(e) {
        point.setAttrs(Canvas.PointStyle);
        that.pointsLayer.draw();
    });
};

Canvas.prototype.updatePolygonShape = function(x, y) {
    if (!this.shape) return;

    var point = _.last(this.shape.points);
    if (!point) return;

    this.updateLine(point, x, y);
    this.linesLayer.draw();
};

Canvas.prototype.updateCircleShape = function(x, y) {
    if (!this.shape) return;

    var dx = Math.abs(this.shape.circle.position().x - x);
    var dy = Math.abs(this.shape.circle.position().y - y);
    this.shape.circle.radius(Math.sqrt(dx*dx + dy*dy));
    this.pointsLayer.draw();
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
    this.mode = mode;
    this.removeLastShape();
    this.endSelection();
};

Canvas.prototype.delete = function() {
    _(this.selectedPoints).forEach(function(p) {
        if (p.prevNode) p.prevNode.nextNode = null;
        if (p.prevNode) p.prevNode.nextLine = null;
        if (p.nextNode) p.nextNode.prevNode = null;
        if (p.nextNode) p.nextNode.prevLine = null;
        if (p.prevLine) p.prevLine.remove();
        if (p.nextLine) p.nextLine.remove();
        p.remove();
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
        that.updatePoint(p, {x: x});
    });

    this.pointsLayer.draw();
    this.linesLayer.draw();
};

Canvas.prototype.halign = function() {
    if (this.selectedPoints.length < 2) return;

    var that = this;
    var y = this.selectedPoints[0].position().y;

    _(this.selectedPoints).forEach(function(p) {
        that.updatePoint(p, {y: y});
    });

    this.pointsLayer.draw();
    this.linesLayer.draw();
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

Canvas.prototype.updatePoint = function(point, attrs) {
    if (attrs && attrs.x) point.position({x: attrs.x, y: point.position().y});
    if (attrs && attrs.y) point.position({x: point.position().x, y: attrs.y});
    if (attrs && attrs.dx) point.position({x: point.position().x + attrs.dx, y: point.position().y});
    if (attrs && attrs.dy) point.position({x: point.position().x, y: point.position().y + attrs.dy});
    if (point.prevNode) this.updateLine(point.prevNode);
    if (point.nextNode) this.updateLine(point);
};

Canvas.prototype.updateLine = function(point, x, y) {
    var pos1 = point.position();
    var pos2 = y ? {x: x, y: y} : point.nextNode.position();
    point.nextLine.points([pos1.x, pos1.y, pos2.x, pos2.y]);
};

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
