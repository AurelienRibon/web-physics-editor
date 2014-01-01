"use strict;"

var Canvas = function() {
    this.points = [];

    var w = 600;
    var h = 400;

    this.stage = new Kinetic.Stage({container: 'canvas', width: w, height: h});

    this.backLayer = new Kinetic.Layer();
    this.linesLayer = new Kinetic.Layer();
    this.pointsLayer = new Kinetic.Layer();

    var back = new Kinetic.Rect(_.merge({width: w, height: h}, Canvas.BackStyle));
    this.backLayer.add(back);

    this.stage.add(this.backLayer);
    this.stage.add(this.linesLayer);
    this.stage.add(this.pointsLayer);

    this.backLayer.on('mousedown', function(e) {
        canvas.addPoint(e.x, e.y);
    });
};

Canvas.prototype.addPoint = function(x, y) {
    var config = _.merge({x: x, y: y, draggable: true}, Canvas.PointStyle);
    var point = new Kinetic.Circle(config);

    this.points.push(point);
    this.pointsLayer.add(point);
    this.update();

    var canvas = this;

    point.on('dragmove', function(e) {
        canvas.update();
    });

    point.on('mouseenter', function(e) {
        point.setFill(Canvas.PointOverStyle.fill);
        canvas.pointsLayer.draw();
    });

    point.on('mouseleave', function(e) {
        point.setFill(Canvas.PointStyle.fill);
        canvas.pointsLayer.draw();
    });
};

Canvas.prototype.update = function() {
    this.linesLayer.removeChildren();

    for (var i=1; i<this.points.length; i++) {
        var x1 = this.points[i-1].getX();
        var y1 = this.points[i-1].getY();
        var x2 = this.points[i].getX();
        var y2 = this.points[i].getY();

        var line = new Kinetic.Line(_.merge({points: [x1, y1, x2, y2]}, Canvas.LineStyle));
        this.linesLayer.add(line);
    }

    this.linesLayer.draw();
    this.pointsLayer.draw();
};