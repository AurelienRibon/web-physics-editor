"use strict;"

// -----------------------------------------------------------------------------
// CREATION
// -----------------------------------------------------------------------------

Canvas.prototype.startPolygonShape = function(x, y) {
    var that = this;

    // Create shape if needed.
    if (this.shape == null) {
        this.shape = {type: 'polygon', points: []};
    }

    // Update last line to end at new point.
    if (this.shape.points.length > 0) {
        var lastPoint = _.last(this.shape.points);
        this.updatePolygonLine(lastPoint, x, y);
        this.linesLayer.draw();
    }

    // Create new point with a line that will follow the mouse.
    this.createPolygonPoint(x, y);
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
    point.shape = this.shape;

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
            if (p != point) that.movePolygonPoint(p, {
                dx: e.offsetX - lastX, 
                dy: e.offsetY - lastY
            });
        });

        that.movePolygonPoint(point);
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
        that.updatePolygonLine(lastPoint);
        that.linesLayer.draw();

        point.fire('mouseleave');
        point.off('click mouseenter mouseleave');
        that.shapes.push(that.shape);
        that.shape = null;
        that.mode = 'edit';
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

// -----------------------------------------------------------------------------
// UPDATE
// -----------------------------------------------------------------------------

Canvas.prototype.updatePolygonShape = function(x, y) {
    if (!this.shape) return;

    var point = _.last(this.shape.points);
    if (!point) return;

    this.updatePolygonLine(point, x, y);
    this.linesLayer.draw();
};

Canvas.prototype.updatePolygonLine = function(point, x, y) {
    var pos1 = point.position();
    var pos2 = y ? {x: x, y: y} : point.nextNode.position();
    point.nextLine.points([pos1.x, pos1.y, pos2.x, pos2.y]);
};

// -----------------------------------------------------------------------------
// MISC
// -----------------------------------------------------------------------------

Canvas.prototype.movePolygonPoint = function(point, attrs) {
    if (attrs && attrs.x) point.position({x: attrs.x, y: point.position().y});
    if (attrs && attrs.y) point.position({x: point.position().x, y: attrs.y});
    if (attrs && attrs.dx) point.position({x: point.position().x + attrs.dx, y: point.position().y});
    if (attrs && attrs.dy) point.position({x: point.position().x, y: point.position().y + attrs.dy});
    if (point.prevNode) this.updatePolygonLine(point.prevNode);
    if (point.nextNode) this.updatePolygonLine(point);
};

Canvas.prototype.clearPolygonPoint = function(point) {
    if (point.prevNode) point.prevNode.nextNode = null;
    if (point.prevNode) point.prevNode.nextLine = null;
    if (point.nextNode) point.nextNode.prevNode = null;
    if (point.nextNode) point.nextNode.prevLine = null;
    if (point.prevLine) point.prevLine.remove();
    if (point.nextLine) point.nextLine.remove();
    _(point.shape.points).remove(point);
    point.remove();
};

Canvas.prototype.linkPolygonShape = function(shape) {
    var that = this;

    if (shape.points.length < 3) {
        _(shape.points).forEachRight(function(p) {
            that.clearPolygonPoint(p);
        });

        _(this.shapes).remove(shape);
        return;
    }

    var circularPoints = shape.points.concat([shape.points[0]]);

    for (var i=0; i<circularPoints.length-1; i++) {
        var p1 = circularPoints[i];
        var p2 = circularPoints[i+1];

        if (p1.nextNode != p2 || p2.prevNode != p1) {
            if (p1.nextLine) p1.nextLine.remove();
            if (p2.prevLine) p2.prevLine.remove();

            p1.nextNode = p2;
            p2.prevNode = p1;
            p1.nextLine = p2.prevLine = this.createPolygonLine(0, 0);
            this.updatePolygonLine(p1);
        }
    }
};