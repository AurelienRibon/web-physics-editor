"use strict;"

// -----------------------------------------------------------------------------
// CONSTRUCTOR
// -----------------------------------------------------------------------------

var Canvas = function(w, h) {
    var that = this;

    this.shape = null;

    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});
    this.backLayer = new Kinetic.Layer();
    this.linesLayer = new Kinetic.Layer();
    this.pointsLayer = new Kinetic.Layer();
    this.frontLayer = new Kinetic.Layer();

    var backConfig = _.merge({width: w, height: h}, Canvas.BackStyle);
    this.backLayer.add(new Kinetic.Rect(backConfig));

    this.stage.add(this.backLayer);
    this.stage.add(this.linesLayer);
    this.stage.add(this.pointsLayer);
    this.stage.add(this.frontLayer);

    this.backLayer.on('mousedown', function(e) {
        that.addPolygonPoint(e.x, e.y);
    });

    this.backLayer.on('mousemove', function(e) {
        if (!this.shape) return;
        if (this.shape.type == 'polygon') this.updatePolygonShape(e.x, e.y);
        if (this.shape.type == 'circle') this.updateCircleShape(e.x, e.y);
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
    if (that.shape.points.length > 0) {
        that.updateLine(_.last(that.shape.points), x, y);
        that.linesLayer.draw();
    }

    // Create a new line from this point.
    var lineConfig = _.merge({points: [0, 0, 0, 0], listening: false}, Canvas.LineStyle);
    var line = new Kinetic.Line(lineConfig);

    this.linesLayer.add(line);
    this.animateFadeIn(line);

    // Create a point visual at this point.
    var pointConfig = _.merge({x: x, y: y, draggable: true}, Canvas.PointStyle);
    var point = new Kinetic.Circle(pointConfig);
    point.prevNode = _.last(this.shape.points);
    point.nextNode = null;
    point.prevLine = null;
    point.nextLine = line;

    this.shape.points.push(point);
    this.pointsLayer.add(point);
    this.animateScaleIn(point);

    // If a previous sibling point exists, update it.
    if (point.prevNode) {
        point.prevNode.nextNode = point;
        point.prevLine = point.prevNode.nextLine;
    }

    // It this visual is the first one, register a click listener.
    if (!point.prevNode) {
        point.on('click', function(e) {
            if (that.shape.points.length < 3) return;

            var lastPoint = _.last(that.shape.points);

            point.prevNode = lastPoint;
            point.prevLine = lastPoint.nextLine;
            lastPoint.nextNode = point;

            point.off('click');

            that.shape = null;
        });
    }

    // Register some listeners for visual updates.
    point.on('mouseenter', function(e) {
        point.setAttrs(Canvas.PointOverStyle);
        that.pointsLayer.draw();
        that.updateLine(_.last(that.shape.points), point.position().x, point.position().y);
        that.linesLayer.draw();
    });

    point.on('mouseleave', function(e) {
        point.setAttrs(Canvas.PointStyle);
        that.pointsLayer.draw();
    });

    point.on('dragmove', function(e) {
        if (point.prevNode) that.updateLine(point.prevNode);
        if (point.nextNode) that.updateLine(point);
        that.linesLayer.draw();
    });
};

Canvas.prototype.addCirclePoint = function(x, y) {
    var that = this;

    if (this.shape == null) {
        this.shape = {type: 'circle', center: null, circle: null};

        var circleConfig = _.merge({x: x, y: y, radius: 0, listening: false}, Canvas.CircleStyle);
        var circle = new Kinetic.Circle(circleConfig);

        this.shape.circle = circle;
        this.linesLayer.add(circle);
        this.linesLayer.draw();

        var pointConfig = _.merge({x: x, y: y, draggable: true}, Canvas.PointStyle);
        var point = new Kinetic.Circle(pointConfig);

        this.shape.center = point;
        this.pointsLayer.add(point);
        this.animateScaleIn(point);

    } else {
        var dx = Math.abs(this.shape.center.position().x - x);
        var dy = Math.abs(this.shape.center.position().y - y);
        this.shape.circle.radius(Math.sqrt(dx*dx + dy*dy));
        this.linesLayer.draw();

        this.shape = null;
    }
};

Canvas.prototype.updatePolygonShape = function(x, y) {
    var point = _.last(this.shape.points);
    if (!point) return;

    this.updateLine(point, x, y);
    this.linesLayer.draw();
};

Canvas.prototype.updateCircleShape = function(x, y) {
    var dx = Math.abs(this.shape.center.position().x - x);
    var dy = Math.abs(this.shape.center.position().y - y);
    this.shape.circle.radius(Math.sqrt(dx*dx + dy*dy));
    this.linesLayer.draw();
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

Canvas.prototype.updateLine = function(point, x, y) {
    var pos1 = point.position();
    var pos2 = y ? {x: x, y: y} : point.nextNode.position();
    point.nextLine.points([pos1.x, pos1.y, pos2.x, pos2.y]);
};

Canvas.prototype.animateScaleIn = function(obj) {
    obj.setAttrs({scaleX: 0, scaleY: 0});

    new Kinetic.Tween({
        node: obj,
        duration: 0.5,
        easing: Kinetic.Easings.BackEaseOut,
        scaleX: 1,
        scaleY: 1
    }).play();
};

Canvas.prototype.animateFadeIn = function(obj) {
    obj.setAttrs({opacity: 0});

    new Kinetic.Tween({
        node: obj,
        duration: 0.5,
        easing: Kinetic.Easings.EaseInOut,
        opacity: 1
    }).play();
};
