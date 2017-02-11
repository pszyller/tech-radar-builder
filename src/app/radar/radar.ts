import {RadarDefinition,RadarSlice,RadarStage,RadarDataItem,RadarDataItemDef} from './radar-definition';
import * as _ from "lodash";
declare var Snap: any;

Snap.plugin(function (Snap, Element, Paper, glob) {
   
 
    Paper.prototype.multitext = function (x, y, txt, max_width, attributes) {

        var svg = Snap();
        var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var temp = svg.text(0, 0, abc);
        temp.attr(attributes);
        var letter_width = temp.getBBox().width / abc.length;
        svg.remove();

        var words = txt.split(" ");
        var width_so_far = 0, current_line = 0, lines = [''];
        for (var i = 0; i < words.length; i++) {

            var l = words[i].length;
            if (width_so_far + (l * letter_width) > max_width) {
                lines.push('');
                current_line++;
                width_so_far = 0;
            }
            width_so_far += l * letter_width;
            lines[current_line] += words[i] + " ";
        }

        var t = this.text(x, y, lines).attr(attributes);
        t.selectAll("tspan:nth-child(n+2)").attr({
            dy: "1.2em",
            x: x
        });
        return t;
    };
});

export class TechRadar {

    vbSize: number;
    s: any;
    scale: number;
    size: number;
    radarAnimation: boolean;
    t: any;
    updateListeners: any;
    colors: any;
    cols: any;
    map: any;
    radarDefinition: RadarDefinition;
    canvasSize: any;
    radius: any;
    centre: any;
    itemDescription: any;
    dr: any;
    readOnly: boolean;

    constructor(radarData, scale) {

        var radarDefinition : RadarDefinition;
var d = {
                "key" : "",
                "config": {
                    "title": "My New Radar",
                    "updateDate": new Date().toString(),
                    "contact": "",
                    "showItemsList" : true,
                    "slices": [
                         {
                            "id" : 1,
                            "name": "Tools/Technologies",
                            "perc": 33.33
                        },
                         {
                            "id" : 2,
                            "name": "Languages",
                            "perc": 33.33
                        },
                         {
                            "id" : 3,
                            "name": "Practices",
                            "perc": 33.33
                        },
                    ],
                    "stages": [
                        {
                            "id" : 1,
                            "name": "On Hold",
                            "perc": 25
                        },
                        {
                            "id" : 2,
                            "name": "Assess",
                            "perc": 25
                        },
                        {
                            "id" : 3,
                            "name": "Trial",
                            "perc": 25
                        },
                        {
                             "id" : 4,
                            "name": "Adopted",
                            "perc": 25
                        }
                    ]
                },
                "data": [
                    {
                        "sliceId": 1,
                        "data": []
                    },
                    {
                        "sliceId": 2,
                        "data": []
                    },
                    {
                        "sliceId": 3,
                        "data": []
                    }
                ]
            };

        radarDefinition = <RadarDefinition>d;
        
        if (radarData == null) {
            radarData = radarDefinition;
        }

        this.vbSize = 2000;
        var svg = document.getElementById('radar');
        if(svg != null)
        svg.remove();
        this.s = Snap().attr(
            {
                id: 'radar',
                width: '100%',
                viewBox: "0,0," + this.vbSize + "," + this.vbSize
            });

        this.scale = scale;
        this.size = 2000 * scale;
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
                '#ffffff',
                '#ffffff',
                '#ffffff',
                '#ffffff',
                '#ffffff',
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

        this.create(this.size, radarData);
        this.radarAnimation = false;
    }

    zoom(val) {
        this.s.attr(
            {
                id: 'radar',
                width: '100%',
                viewBox: "0,0," + (this.vbSize * val / 100) + "," + (this.vbSize * val / 100)
            });
    }

    addUpdateListener(fn) {
        this.updateListeners.push(fn);
    }

    create(size, radarDef) {
        var _this = this;
        this.s.clear();
        this.map = {};
        this.radarDefinition = radarDef;
        this.canvasSize = size;
        this.radius = this.canvasSize / 4;
        this.centre =
            {
                x: this.canvasSize / 2,
                y: this.radius + 100 * _this.scale
            }
        this.init();

        if(this.radarDefinition.config.showItemsList)
        {
            this.drawListing();
        }
        this.itemDescription = this.s.g();
        // this.itemDescription.add(this.s.rect(0, 0, 300, 100,20).attr({   fill: "#ffffff", stroke: "#050505",
        //     strokeWidth: 1,
        //          "fill-opacity" : 0.9})).attr({ id: "itemDescription"});

        this.itemDescription.show = function (title, desc, x, y) {
            var t = this;

            //    if(t.attr("display") != "none")
            //    return;

            t.selectAll("text").remove();
            var ctt = _this.s.multitext(0, 0, title, 500 * _this.scale, { "font-size": (30 * _this.scale) + "px" });
            var ct = _this.s.multitext(0, 50 * _this.scale, desc, 500 * _this.scale, { "font-size": (25 * _this.scale) + "px" });
            t.add(ctt, ct);
            t.attr('transform', 't' + (x * _this.scale) + ',' + (y * _this.scale));
        }
    }

    add(item, x, y, color, initBounce : boolean = false) {
        var _this = this;
        var dragObj = { matrix: { e: {}, f: {} } };
        var g = this.s.g();

        var move = function (dx, dy) {
            dx *= 2000 / window.innerWidth;
            dy *= 2000 / window.innerWidth;
            //_this.itemDescription.attr({ "display": "none" });

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
        if(initBounce)
        {
        Snap.animate(600, 100, function (val) {
                c.transform('s' + (val/100));
            }, 500, mina.bounce);
        }


        var ct = this.s.multitext(10, 5, item.title, 150, { "font-size": (15 * _this.scale) + "px" });

        if (!_this.radarAnimation)
            g.transform('t' + x + ',' + y);
        g.add(c, ct);
        g.radarItem =
            {
                title: item.title,
                desc: item.desc,
            };

        if (!this.readOnly) {
            g.drag(move, start, stop);
            g.attr({ 'cursor': 'move' });
        }

        g.hover(function () {
            //  _this.itemDescription.attr({x: g.matrix.e, y:g.matrix.f - 250, "display": ""});
            _this.itemDescription.show(g.radarItem.title, g.radarItem.desc, 50, 150);

            Snap.animate(1, 2, function (val) {
                c.transform('s' + val);
            }, 500, mina.bounce);

        }, function () {
            //_this.itemDescription.attr({ "display": "none" });

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
            strokeWidth: width
        });

        if (this.radarAnimation) {
            Snap.animate(0, 100, function (val) {
                arc.attr({
                    'stroke-opacity': (val / 100)
                });

            }, 100 + (radius * 5), mina.easeinout);
            Snap.animate(0, width, function (val) {
                arc.attr({
                    'strokeWidth': val
                });

            }, 100 + (radius * 5), mina.backout);
        }
        return arc;
    }

    drawRing(parts: any, radius: any, width: any, oncreated: any, color: any) {
        
        let rotSum:number = 0;
        for (var i = 0; i < parts; i++) {
            
            var rot = 360 * (this.radarDefinition.config.slices[i].perc/100); //(360 / parts);
            
            console.log('rot ' + i + ' : ' + rot + '   pecr: ' + this.radarDefinition.config.slices[i].perc );
            var c2 = this.draw(this.radarDefinition.config.slices[i].perc/100, radius, color || this.colors[i], width);
            c2.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            rotSum +=rot;
            oncreated(i, c2);
        }
    }

    write(text, x, y) {
        this.t.remove();
        this.t = this.s.text(x || 100, y || 50, text);
    }

    drawListing() {
        var slicesLength = this.radarDefinition.config.slices.length;
        var stagesLength = this.radarDefinition.config.stages.length;
        var _this = this;
        var bullet = { col: '', x: 50, y: _this.centre.y + _this.radius + 100, ox: 50, oy: _this.centre.y + _this.radius + 100 };
        var gr = this.s.g();
        var column = { i: 0, width: (_this.canvasSize) / (slicesLength) };

        _.forEach(_.sortBy(this.radarDefinition.data, function (c: any) {
            return c.slice;
        }), function (slice:RadarDataItem) {

            var ind = _.findIndex(_this.radarDefinition.config.slices, function (e) { return e.id == slice.sliceId });
            var elem = _.find(_this.radarDefinition.config.slices, function(e) { return e.id == slice.sliceId } );
            bullet.col = _this.cols[ind];
            bullet.y += 30;
            //  if(column.i%3 == 0)
            //  {
            bullet.x = bullet.ox + column.i * column.width;
            bullet.y = bullet.oy;
            // }

            column.i++;
            if(!elem)
            return;
            _this.s.text(bullet.x, bullet.y, elem.name).attr({
                'fill': bullet.col, 'stroke': '#000000', 'stroke-width': 1.0,
                "font-size": "20px",
                "font-family": "Super Sans"
            });

            var currentStage = { stageId: -1 };
            _.forEach(_.sortBy(slice.data, function (c: RadarDataItemDef) {
                return _this.radarDefinition.config.stages.length - _.findIndex(_this.radarDefinition.config.stages, function (e: RadarStage) {
                    return e.id == c.stageId;
                });
            }), function (stage) {

        var ind = _.findIndex(_this.radarDefinition.config.stages, function (e) {
                    return e.id == stage.stageId
                });
                       var st = _.find(_this.radarDefinition.config.stages, function (e) {
                    return e.id == stage.stageId
                });

                if (currentStage.stageId != stage.stageId) {
                    currentStage.stageId = stage.stageId;
                    bullet.y += 30;
                    var b = 
                    _this.s.text(bullet.x + 5, bullet.y + 5, st.name.toUpperCase()).attr(
                        {
                            'font-family': "Super Sans",
                            'fill': '#000000', 'stroke': '#000000', 'stroke-width': 1.0,
                        });
               
                    bullet.y += 30;
                }

        
        

                _this.s.circle(bullet.x, bullet.y, 4)
                    .attr({
                        fill: bullet.col,
                        'fill-opacity': 0.5,
                        stroke: "#050505",
                        "font-family": "Super Sans",
                        strokeWidth: 1
                    });

                var title = _this.s.text(bullet.x + 20, bullet.y + 5, stage.title).attr(
                    {
                        fill: bullet.col,
                        "font-size": "15px",
                    });

                var desc = _this.s.multitext(bullet.x + 20, bullet.y + 5, stage.title + ' ' + (stage.desc ? ' - ' + stage.desc : ''), column.width - 50,
                    {
                        "font-size": "15px",
                    });

                // _this.s.text(bullet.x +20, bullet.y + 5, stage.title + (stage.desc ? ' - ' : '') + stage.desc).attr(
                //     {
                //            "font-family" : "Super Sans"
                //     });
                bullet.y += desc.node.clientHeight;
                //       var rect = this.s.rect(this.centre - this.radius, this.centre + this.radius, 100,100)
                // .attr({strokeWidth:3});
            });
            //   bullet.y += 20;

        });


    }

    init() {
        var slicesLength = this.radarDefinition.config.slices.length;
        var stagesLength = this.radarDefinition.config.stages.length;
        var _this = this;

        var current = null;
        this.map = {};

        var title = _this.s.paper.text(this.centre.x, 50, _this.radarDefinition.config.title.toUpperCase()).attr(
            {
                'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.5,
                "font-size": "25px",
                "font-family": "Super Sans",
                "text-anchor": "middle",
            });

        // _this.s.paper.text(800, 15, 'contact: ' + _this.data.config.contact).attr(
        //     {
        //         'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.2,
        //         "font-size": "15px",
        //         "text-anchor": "start",
        //         "font-family" : "Super Sans Bold"
        //     });

        this.drawRing(slicesLength, _this.radius + (20), 35, function (sliceIndex, elem) {
            var l = elem.getTotalLength();
            var t1 = _this.s.paper.text(l / 2, 0, _this.radarDefinition.config.slices[sliceIndex].name).attr(
                {
                    textpath: elem,
                    'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.2,
                    "font-size": "15px",
                    "text-anchor": "middle",
                    "font-family": "Super Sans"
                });
                
        }, "#DDDDDD");

        var rSum = 0;
        for (var i = 0; i < stagesLength; i++) {
            // _this.radius = this.canvasSize / 2.5;
            var ringWidth = _this.radius * (_this.radarDefinition.config.stages[i].perc / 100);
            var shift = ringWidth / 2;
        
            this.drawRing(slicesLength, _this.radius - (rSum) - shift, ringWidth, function (sliceIndex, elem) {
                //oncreated

                var slice = _this.radarDefinition.config.slices[sliceIndex];
                var key = _this.radarDefinition.config.slices[sliceIndex] + '|' + _this.radarDefinition.config.stages[i];
                var stagei = _this.radarDefinition.config.stages[i].id;

                var l = elem.getTotalLength();
                var size = 20;
                if(l < 40) size = 15;
                if(l < 20) size = 5;
               // if(l < 20) size = 10;
                console.log('L: ' + l);
                var t1 = _this.s.paper.text(l / 2, 0, _this.radarDefinition.config.stages[i].name).attr(
                    {
                        textpath: elem,
                        'fill': '#EEEEEE', 'stroke': '#EEEEEE', 'stroke-width': 0.2,
                        "font-size":  size + "px",
                        "text-anchor": "middle",
                        "font-family": "Super Sans"
                    });
                //  t1.transform('r' + (360/slicesLength*i) + ',' + _this.centre + ',' + _this.centre);

                elem.hover(function () {
                    current = _this.map[key];
                    current.attr({ 'origStroke': current.attr('stroke') });

                    //_this.write(key);
                    if (_this.dr && _this.dr.attr('display') == "none") {
                        var slice =
                            _.find(_this.radarDefinition.data, function (e: RadarDataItem) {
                                return e.sliceId == _this.radarDefinition.config.slices[sliceIndex].id;
                            });

                        if (!slice) {
                            slice = {
                                sliceId: _this.radarDefinition.config.slices[sliceIndex].id,
                                data: []
                            };
                            _this.radarDefinition.data.push(slice);

                        }

                        var newItem = <RadarDataItemDef>_this.dr.radarItem;
                        newItem.stageId= stagei;
                        newItem.x = _this.dr.matrix.e;
                        newItem.y = _this.dr.matrix.f;

                        _.forEach(_this.radarDefinition.data, function (sliceElem) {
                            var existing =
                                _.findIndex(sliceElem.data, function (b: RadarDataItemDef) { return b.title == newItem.title });

                            if (existing >= 0) {
                                sliceElem.data.splice(existing, 1);
                            }
                        });

                        var dx = _this.centre.x - newItem.x;
                        var dy = _this.centre.y - newItem.y;
                        if (Math.sqrt(dx * dx + dy * dy) <= _this.radius) {
                            newItem.x *= 1 / _this.scale;
                            newItem.y *= 1 / _this.scale;
                            slice.data.push(newItem);
                        }
                        _this.dr.attr({ display: "" });
                        _this.updateListeners.forEach(function (fn) {
                            fn(_this.radarDefinition);
                        });

                        Snap.animate(255, 240, function (val) { elem.attr({ "stroke": 'rgb(' + val + ',' + val + ',' + val + ')' }) }, 300, mina.linear,
                            function () {
                                Snap.animate(240, 255, function (val) { elem.attr({ "stroke": 'rgb(' + val + ',' + val + ',' + val + ')' }) }, 300, mina.linear,
                                    function () {
                                        _this.create(_this.size, _this.radarDefinition);
                                    });
                            }
                        );

                    }

                }, function () {
                    current = _this.map[key];



                    //     current.attr({ stroke: '#ff0000'});
                });
                _this.map[key] = elem;
            }, this.colors[i]);
     var f =this.s.paper.filter(Snap.filter.blur(5, 10));
            var c = this.s.paper.circle(this.centre.x, this.centre.y, _this.radius - (rSum)).attr({
         
             strokeWidth: 1,
             fill: "none",
                     stroke: "#cccccc",
                     strokeLinecap: "round",
                        filter: f,
            });
            rSum += ringWidth;
        }

        var rotSum = 0;
        for (var i = 0; i < slicesLength; i++) {
            var rot = this.radarDefinition.config.slices[i].perc * 360 / 100;
            var f = this.s.filter(Snap.filter.blur(5, 10));
            var line = this.s.paper.line(this.centre.x, this.centre.y, this.centre.x, this.centre.y - _this.radius).attr(
                {
                     strokeWidth: 1,
                     stroke: "#cccccc",
                     strokeLinecap: "round",
                     filter: f
                });
            line.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            rotSum +=rot;
        }

        var obj = _this.radarDefinition.data;

        _.forEach(obj, function (slElems) {
            var sliceId = slElems.sliceId;
            _.forEach(slElems.data, function (obj) {
                var ind = _.findIndex(_this.radarDefinition.config.slices, function (e) { return e.id == sliceId })
                _this.add(obj, obj.x * _this.scale, obj.y * _this.scale, _this.cols[ind]);
            });
        });



        return this;
    }

}










