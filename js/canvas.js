"use strict;"

// -----------------------------------------------------------------------------
// CONSTRUCTOR
// -----------------------------------------------------------------------------

var Canvas = function(w, h) {
    this.shapes = [];

    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});
    this.backLayer = new Kinetic.Layer();
    this.linesLayer = new Kinetic.Layer();
    this.pointsLayer = new Kinetic.Layer();

    var backConfig = _.merge({width: w, height: h}, Canvas.BackStyle);
    this.backLayer.add(new Kinetic.Rect(backConfig));

    this.stage.add(this.backLayer);
    this.stage.add(this.linesLayer);
    this.stage.add(this.pointsLayer);

    var canvas = this;

    this.backLayer.on('mousedown', function(e) {
        canvas.addPoint(e.x, e.y);
    });
};

// -----------------------------------------------------------------------------
// PUBLIC API
// -----------------------------------------------------------------------------

Canvas.prototype.addPoint = function(x, y) {
    // Get shape

    var shape = _.last(this.shapes);

    if (!shape || shape.isClosed) {
        shape = new Models.PolygonShape();
        this.shapes.push(shape);
    }

    // Add point

    var lastPoint = _.last(shape.points);
    var newPoint = {x: x, y: y};
    shape.points.push(newPoint);

    var pointConfig = _.merge({x: x, y: y}, Canvas.PointStyle);
    var point = new Kinetic.Circle(pointConfig);
    point.model = newPoint;
    this.pointsLayer.add(point);
    this.pointsLayer.draw();

    // Add line

    if (lastPoint) {
        var points = [lastPoint.x, lastPoint.y, x, y];
        var lineConfig = _.merge({points: points}, Canvas.LineStyle);
        var line = new Kinetic.Line(lineConfig);
        line.model = [lastPoint, newPoint];
        this.linesLayer.add(line);
        this.linesLayer.draw();
    }

    // Add event handlers

    var canvas = this;

    point.on('mouseenter', function(e) {
        if (!shape.isClosed && shape.points.length > 2 && point.model === _.first(shape.points)) {
            point.setFill(Canvas.PointOverStyle.fill);
            canvas.pointsLayer.draw();
        }
    });

    point.on('mouseleave', function(e) {
        point.setFill(Canvas.PointStyle.fill);
        canvas.pointsLayer.draw();
    });

    point.on('mousedown', function(e) {
        if (!shape.isClosed && shape.points.length > 2 && point.model === _.first(shape.points)) {
            canvas.closeLastShape();
        }
    });

    point.on('dragmove', function(e) {
        canvas.linesLayer.draw();
    });
};

Canvas.prototype.closeLastShape = function() {
    var shape = _.last(this.shapes);
    shape.isClosed = true;

    var lastPoint = _.last(shape.points);
    var firstPoint = _.first(shape.points);

    var points = [lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y];
    var lineConfig = _.merge({points: points}, Canvas.LineStyle);
    var line = new Kinetic.Line(lineConfig);
    line.model = [lastPoint, firstPoint];
    this.linesLayer.add(line);
    this.linesLayer.draw();
};
