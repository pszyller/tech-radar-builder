
class TechRadar {

    constructor(radarData) {
        this.s = Snap('#radar');
        this.radarAnimation = true;
        this.t = this.s.text(10, 10, "text");
        this.updateListeners = [];
        this.colors =
            [
                '#ffffff',
                '#ffffff',
                '#ffffff',
                '#ffffff',
                '#ffffff',
            ];
        this.cols =
            [
                '#ff0000',
                '#00ff00',
                '#000ff0',
                '#0ff000',
                '#0f00ff',
            ];

        this.create(2000, radarData);
        this.radarAnimation = false;
    }

    addUpdateListener(fn) {
        this.updateListeners.push(fn);
    }

    create(size, radarDef) {
        this.s.clear();
        this.map = {};
        this.data = radarDef;
        this.canvasSize = size;
        this.radius = this.canvasSize / 4;
        this.centre = 
        {
            x: this.canvasSize / 2,
            y: this.radius + 100 
        } 
        this.init();
        this.drawListing();
    }

    add(name, x, y, color) {
        var _this = this;
        var dragObj = {};
        var move = function (dx, dy) {
            this.attr({
                transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
            });
        }

        var start = function () {
            dragObj = this;
            this.data('origTransform', this.transform().local);
        }

        var stop = function () {
            var x = dragObj.matrix.e;
            var y = dragObj.matrix.f;
            _this.dr = dragObj;

            _this.dr.attr({ display: "none" });

        }

        var c = this.s.circle(0, 0, 4);
        c.attr({
            fill: color,
            'fill-opacity': 0.5,
            stroke: "#050505",
            strokeWidth: 1
        });
        var ct = this.s.text(0 + 10, 5, name);
        var g = this.s.g();
        if (!_this.radarAnimation)
            g.transform('t' + x + ',' + y);
        g.add(c, ct);
        g.radarItem =
            {
                title: name,
                desc: '',
            };
        g.drag(move, start, stop);
        g.attr({ 'cursor': 'move' });
        g.hover(function () {

            Snap.animate(1, 2, function (val) {
                c.transform('s' + val);
            }, 500, mina.bounce);

        }, function () {
            Snap.animate(2, 1, function (val) {
                c.transform('s' + val);
            }, 500, mina.bounce);

        });
        if (_this.radarAnimation) {
            Snap.animate(0, 100, function (val) {
                var nx = (_this.centre.x - (_this.centre.x * val / 100)) + (x * val / 100);
                var ny = (_this.centre.y - (_this.centre.y * val / 100)) + (y * val / 100);
                g.transform('t' + nx + ',' + ny);


            }, 500, mina.linear);
        } else {

        }

    }

    draw(percent, radius, color, width) {
        var arc = this.s.path("");
        var startY = this.centre.y - radius;
        var endpoint = percent * 360;

        var d = endpoint,
            dr = d - 90,
            radians = Math.PI * (dr) / 180,
            endx = this.centre.x + radius * Math.cos(radians),
            endy = this.centre.y + radius * Math.sin(radians),
            largeArc = d > 180 ? 1 : 0,
            path = "M" + this.centre.x + "," + startY + " A" + radius + "," + radius + " 0 " + largeArc + ",1 " + endx + "," + endy;

        arc = this.s.path(path);
        arc.attr({
            stroke: color,
            fill: 'none',
            'stroke-opacity': this.radarAnimation ? 0 : 1,
            strokeWidth: width - 1
        });

        if (this.radarAnimation) {
            Snap.animate(0, 100, function (val) {
                arc.attr({
                    'stroke-opacity': (val / 100)
                });

            }, 100 + (radius * 5), mina.easeinout);
            Snap.animate(0, width - 1, function (val) {
                arc.attr({
                    'strokeWidth': val
                });

            }, 100 + (radius * 5), mina.backout);
        }
        return arc;
    }

    drawRing(parts, radius, width, oncreated, color) {
        var rot = 360 / parts;
        for (var i = 0; i < parts; i++) {
            var c2 = this.draw(1 / parts, radius, color || this.colors[i], width);
            c2.transform('r' + (rot * i) + ',' + this.centre.x + ',' + this.centre.y);
            oncreated(i, c2);
        }
    }

    write(text, x, y) {
        this.t.remove();
        this.t = this.s.text(x || 100, y || 50, text);
    }

    drawListing() {
        var slicesLength = this.data.config.slices.length;
        var stagesLength = this.data.config.stages.length;
        var _this = this;
        var bullet = { x: 50, y: 120 };
        var gr = this.s.g();
        gr.add(this.s.rect(25,80, 400,500,10)).attr(
            {
                "fill" : "white"
            });
        _.forEach(_.sortBy(this.data.data, function(c)
        {
            return c.slice;
        }), function (slice) {
            _this.s.text(bullet.x, bullet.y, slice.slice.toUpperCase()).attr({
                'fill': '#000000', 'stroke': '#000000', 'stroke-width': 1.0,
                "font-size": "20px",
                "font-family" : "Super Sans"
            });

            var ind = _.findIndex(_this.data.config.slices, function (e) 
            {
                 return e == slice.slice 
                });

            bullet.col = _this.cols[ind];
            bullet.y += 30;
            var currentStage = { name: ''};
            _.forEach(_.sortBy(slice.data, function(c)
            {
                return _this.data.config.stages.length - _.findIndex(_this.data.config.stages, function (e) 
            {
                 return e.name == c.stage; 
                });
            }), function (stage) {
              
                if(currentStage.name != stage.stage)
                {
                  currentStage.name = stage.stage;
                  _this.s.text(bullet.x +30, bullet.y + 5,stage.stage.toUpperCase()).attr(
                      {
                          "font-family" : "Super Sans",
                        'fill': '#000000', 'stroke': '#000000', 'stroke-width': 1.0,
                      });
                  bullet.y += 30;
                }

                var ind = _.findIndex(_this.data.config.stages, function (e) 
                {
                    return e.name == stage.stage
                    });

                _this.s.circle(bullet.x, bullet.y, 4)
                .attr({
                    fill: bullet.col,
                    'fill-opacity': 0.5,
                    stroke: "#050505",
                       "font-family" : "Super Sans",
                    strokeWidth: 1
                });

                _this.s.text(bullet.x +20, bullet.y + 5, stage.title + (stage.desc ? ' - ' : '') + stage.desc).attr(
                    {
                           "font-family" : "Super Sans"
                    });
                bullet.y += 30;
                //       var rect = this.s.rect(this.centre - this.radius, this.centre + this.radius, 100,100)
                // .attr({strokeWidth:3});
            });
            bullet.y += 20;
                  
        });


    }

    init() {
        var slicesLength = this.data.config.slices.length;
        var stagesLength = this.data.config.stages.length;
        var _this = this;

        var current = null;
        this.map = {};

        var title = _this.s.paper.text(10, 70, _this.data.config.title.toUpperCase()).attr(
            {
                'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.5,
                "font-size": "25px",
                "font-family" : "Super Sans"

            });

        _this.s.paper.text(800, 15, 'contact: ' + _this.data.config.contact).attr(
            {
                'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.2,
                "font-size": "15px",
                "text-anchor": "start",
                "font-family" : "Super Sans Bold"
            });

        this.drawRing(slicesLength, _this.radius + (20), 35, function (sliceIndex, elem) {
            var l = elem.getTotalLength();
            var t1 = _this.s.paper.text(l / 2, 0, _this.data.config.slices[sliceIndex]).attr(
                {
                    textpath: elem,
                    'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.2,
                    "font-size": "15px",
                    "text-anchor": "middle",
                    "font-family" : "Super Sans"
                });
        }, "#DDDDDD");


        var rSum = 0;
        for (var i = 0; i < stagesLength; i++) {
           // _this.radius = this.canvasSize / 2.5;
            var ringWidth = _this.radius * _this.data.config.stages[i].scale;
            var shift = ringWidth / 2;

            this.drawRing(slicesLength, _this.radius - (rSum) - shift, ringWidth, function (sliceIndex, elem) {
                //oncreated

                var slice = _this.data.config.slices[sliceIndex];
                var key = _this.data.config.slices[sliceIndex] + '|' + _this.data.config.stages[i];
                var stagei = _this.data.config.stages[i].name;

                var l = elem.getTotalLength();
                var t1 = _this.s.paper.text(l / 2, 0, _this.data.config.stages[i].name).attr(
                    {
                        textpath: elem,
                        'fill': '#EEEEEE', 'stroke': '#EEEEEE', 'stroke-width': 0.2,
                        "font-size": "20px",
                        "text-anchor": "middle",
                        "font-family" : "Super Sans"
                    });
                //  t1.transform('r' + (360/slicesLength*i) + ',' + _this.centre + ',' + _this.centre);

                elem.hover(function () {
                    current = _this.map[key];
                    current.attr({ 'origStroke': current.attr('stroke') });

                    //_this.write(key);
                    if (_this.dr && _this.dr.attr('display') == "none") {
                        var slice =
                            _.find(_this.data.data, function (e) {
                                return e.slice == _this.data.config.slices[sliceIndex];
                            });

                        if (!slice) {
                            slice = {
                                slice: _this.data.config.slices[sliceIndex],
                                data: []
                            };
                            _this.data.data.push(slice);

                        }

                        var newItem = _this.dr.radarItem;
                        newItem.stage = stagei;
                        newItem.x = _this.dr.matrix.e;
                        newItem.y = _this.dr.matrix.f;

                        _.forEach(_this.data.data, function (sliceElem) {
                            var existing =
                                _.findIndex(sliceElem.data, function (b) { return b.title == newItem.title });

                            if (existing >= 0) {
                                sliceElem.data.splice(existing, 1);
                            }
                        });

                        var dx = _this.centre.x - newItem.x;
                        var dy = _this.centre.y - newItem.y;
                        if (Math.sqrt(dx * dx + dy * dy) <= _this.radius) {
                            slice.data.push(newItem);
                        }
                        _this.dr.attr({ display: "" });
                        _this.updateListeners.forEach(function (fn) {
                            fn(_this.data);
                        });

                        Snap.animate(255, 240, function (val) { elem.attr({ "stroke": 'rgb(' + val + ',' + val + ',' + val + ')' }) }, 300, mina.linear,
                            function () {
                                Snap.animate(240, 255, function (val) { elem.attr({ "stroke": 'rgb(' + val + ',' + val + ',' + val + ')' }) }, 300, mina.linear,
                                    function () {
                                        _this.create(2000, _this.data);
                                    });
                            }
                        );

                    }

                }, function () {
                    current = _this.map[key];



                    //     current.attr({ stroke: '#ff0000'});
                });
                _this.map[key] = elem;
            });

            rSum += ringWidth;
        }

        for (var i = 0; i < slicesLength; i++) {
            var line = this.s.paper.line(this.centre.x, this.centre.y, this.centre.x, this.centre.y - _this.radius).attr({ strokeWidth: 1, stroke: "#cccccc", strokeLinecap: "round" });
            line.transform('r' + (360 / slicesLength * i) + ',' + this.centre.x + ',' + this.centre.y);
        }



        var obj = _this.data.data;

        _.forEach(obj, function (slElems) {
            var slice = slElems.slice;
            _.forEach(slElems.data, function (obj) {
                var ind = _.findIndex(_this.data.config.slices, function (e) { return e == slice })

                _this.add(obj.title, obj.x, obj.y, _this.cols[ind]);
            });
        });



        return this;
    }

}










