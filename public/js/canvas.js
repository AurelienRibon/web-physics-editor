"use strict;"

// -----------------------------------------------------------------------------
// CONSTRUCTOR
// -----------------------------------------------------------------------------

var Canvas = function(w, h) {
    var that = this;

    this.shape = {points: []};

    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});
    this.backLayer = new Kinetic.Layer();
    this.linesLayer = new Kinetic.Layer();
    this.pointsLayer = new Kinetic.Layer();

    var backConfig = _.merge({width: w, height: h}, Canvas.BackStyle);
    this.backLayer.add(new Kinetic.Rect(backConfig));

    this.stage.add(this.backLayer);
    this.stage.add(this.linesLayer);
    this.stage.add(this.pointsLayer);

    this.backLayer.on('mousedown', function(e) {
        that.addPolygonPoint(e.x, e.y);
    });
};

// -----------------------------------------------------------------------------
// PUBLIC API
// -----------------------------------------------------------------------------

Canvas.prototype.addPolygonPoint = function(x, y) {
    var that = this;

    var pointConfig = _.merge({x: x, y: y, draggable: true}, Canvas.PointStyle);
    var point = new Kinetic.Circle(pointConfig);
    point.prevNode = _.last(this.shape.points);
    point.nextNode = null;
    point.prevLine = null;
    point.nextLine = null;

    this.shape.points.push(point);
    this.pointsLayer.add(point);
    this.animateScaleIn(point);

    point.on('dragmove', function(e) {
        if (point.prevNode) {
            var pos1 = point.prevNode.position();
            var pos2 = point.position();
            point.prevLine.points([pos1.x, pos1.y, pos2.x, pos2.y]);
        }

        if (point.nextNode) {
            var pos1 = point.position();
            var pos2 = point.nextNode.position();
            point.nextLine.points([pos1.x, pos1.y, pos2.x, pos2.y]);
        }

        that.linesLayer.draw();
    });

    if (point.prevNode) {
        var pos = point.prevNode.position();
        var lineConfig = _.merge({points: [pos.x, pos.y, x, y], listening: false}, Canvas.LineStyle);
        var line = new Kinetic.Line(lineConfig);

        this.linesLayer.add(line);
        this.animateFadeIn(line);

        point.prevNode.nextNode = point;
        point.prevNode.nextLine = line;
        point.prevLine = line;
    }

    if (!point.prevNode) {
        point.on('mouseenter', function(e) {
            if (that.shape.points.length < 3) return;

            point.setAttrs(Canvas.PointOverStyle);
            that.pointsLayer.draw();
        });

        point.on('mouseleave', function(e) {
            point.setAttrs(Canvas.PointStyle);
            that.pointsLayer.draw();
        });

        point.on('click', function(e) {
            if (that.shape.points.length < 3) return;

            var lastPoint = _.last(that.shape.points);
            
            var pos1 = lastPoint.position();
            var pos2 = point.position();
            var lineConfig = _.merge({points: [pos1.x, pos1.y, pos2.x, pos2.y], listening: false}, Canvas.LineStyle);
            var line = new Kinetic.Line(lineConfig);

            that.linesLayer.add(line);
            that.animateFadeIn(line);

            point.prevNode = lastPoint;
            point.prevLine = line;
            lastPoint.nextNode = point;
            lastPoint.nextLine = line;

            point.fire('mouseleave');
            point.off('click mouseenter mouseleave');

            that.shape = {points: []};
        });
    }
};

// Canvas.prototype.addCirclePoint = function(x, y) {
//     var shape = _.last(this.model.circleShapes);

//     if (!shape || shape.isClosed) {
//         shape = new Models.CircleShape();
//         this.model.circleShapes.push(shape);

//         shape.center.x = x;
//         shape.center.y = y;

//         var pointConfig = _.merge({x: x, y: y}, Canvas.PointStyle);
//         var point = new Kinetic.Circle(pointConfig);
//         this.pointsLayer.add(point);
//         this.pointsLayer.draw();

//         var circleConfig = _.merge({x: x, y: y, radius: 20}, Canvas.CircleStyle);
//         var circle = new Kinetic.Circle(circleConfig);
//         this.linesLayer.add(circle);
//         this.linesLayer.draw();

//     } else {
//         var dx = x - shape.center.x;
//         var dy = y - shape.center.y;

//         shape.radius = Math.sqrt(dx * dx + dy * dy);
//         shape.isClosed = true;
//     }
// };

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

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
