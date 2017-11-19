import { RadarDefinition, RadarSlice, RadarStage, RadarDataItem, RadarDataItemDef, HistoryItem } from './radar-definition';
import * as _ from "lodash";
import { Observable, Observer } from "rxjs/"
import { ColorHelper } from 'app/radar/colorHelper';
declare var Snap: any;

Snap.plugin(function (Snap, Element, Paper, glob) {


    Paper.prototype.multitext = function (x, y, txt, max_width, attributes) {

        var svg = Snap();
        var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var temp = svg.text(0, 0, abc);
        temp.attr(attributes);
        var letter_width = temp.getBBox().width / abc.length;
        svg.remove();

        var words = (txt || "").split(" ");
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
    editItem: any;
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
    lockRadarMove: boolean;
    onItemStageChange: any;
    scalar: number = 1;
    proto: RadarDefinition;
    currentElem: any;
    cache: {} = new Object();
    mapMoved: boolean;
    layerGroup: any;
    colorHelper : ColorHelper = new ColorHelper();
    layer0: any;
    layer3: any;
    layer1: any;
    layer2: any;
    layer4: any;


    constructor(radarData, scale, readOnly: boolean) {

        this.readOnly = readOnly;
        var radarDefinition: RadarDefinition;

        radarDefinition = _.cloneDeep(TechRadar.prototype.proto);

        if (radarData == null) {
            radarData = radarDefinition;
        }

        this.vbSize = 2000;
        var svg = document.getElementById('radar');
        if (svg != null)
            svg.remove();
        this.s = Snap().attr(
            {
                id: 'radar',
                width: '100%',
                //      transform: 's' + this.scale,
                viewBox: "0,0," + this.vbSize + "," + this.vbSize,
            });


        var _this = this;
        this.s.mousemove(function (ev, x, y, c, b) {

            if (_this.currentElem) {
                _this.currentElem.x = (ev.offsetX * 2000 / window.innerWidth - _this.layerGroup.matrix.e)/ _this.scalar;
                _this.currentElem.y = (ev.offsetY * 2000 / window.innerWidth - _this.layerGroup.matrix.f)/ _this.scalar;

                console.log('pos:' + (_this.currentElem.x) + ' ' +(_this.currentElem.y));
             //   _this.s.circle(ev.offsetX * 2000 / window.innerWidth, ev.offsetY * 2000 / window.innerWidth, 15);
            }
            console.log('scalar:' + _this.scalar + '  scale:'+ _this.scale);
            if (ev.buttons > 0 && !_this.lockRadarMove) {
                _this.mapMoved = true;
                _this.layerGroup.transform('S' + _this.scalar + ' 0 0 T' + (_this.layerGroup.matrix.e + ev.movementX) + ',' + (_this.layerGroup.matrix.f + ev.movementY));
            }
            else
                _this.mapMoved = false;
        });

        if ((/Firefox/i.test(navigator.userAgent))) {
            this.s.node.addEventListener("DOMMouseScroll", mouseWheelHandler, false);
        } else {
            this.s.node.addEventListener("mousewheel", mouseWheelHandler, false);
        }

        function mouseWheelHandler(ev) {
            ev.preventDefault();

            if (ev.deltaY < 0) {
                if (_this.scalar < 3.5)
                    _this.scalar -= ev.deltaY / 1000;
                else
                    return;
            }
            else {
                if (_this.scalar > 0.5)
                    _this.scalar -= ev.deltaY / 1000;
                else
                    return;
            }
            console.log('scale: ' + _this.scalar);


            _this.layerGroup.transform('s' + _this.scalar + ' 0 0 T' + (_this.layerGroup.matrix.e + ev.deltaY) + ',' + (_this.layerGroup.matrix.f + ev.deltaY));
            _this.create(_this.size, radarData);
        }

        this.scale = scale;
        this.size = 2000 * scale;
        this.radarAnimation = true;
        this.t = this.s.text(10, 10, "text");
        this.updateListeners = [];
        this.create(this.size, radarData);
        this.radarAnimation = false;
    }

    zoom(val) {
        this.scale += 0.1;
    }

    addUpdateListener(fn) {
        this.updateListeners.push(fn);
    }

    create(size, radarDef) {
        var _this = this;
        var saveTransform = 'S' + this.scalar + ' 0 0 T0,0';


        if (this.s.select("#group")) {
            saveTransform = this.s.select("#group").attr('transform').string;
        }

        this.s.clear();
        this.layerGroup = this.s.paper.g().attr("id", "group");
        this.layerGroup.attr('transform', saveTransform);

        this.layer0 = this.s.paper.g().attr({ id: "layer0" });

        this.layer1 = this.s.paper.g().attr({ id: "layer1" });
        this.layer2 = this.s.paper.g().attr({ id: "layer2", display: "none" });
        this.layer3 = this.s.paper.g().attr({ id: "layer3", "fill": "transparent", "cursor": "move" });
        this.layer4 = this.s.paper.g().attr({ id: "layer3", "fill": "transparent", "cursor": "move" });

        this.layerGroup.add(this.layer1);
        this.layerGroup.add(this.layer3);
        this.layerGroup.add(this.layer4);
        this.layerGroup.add(this.layer0);
        this.layerGroup.add(this.layer2);

        this.layer3.add(this.s.paper.rect(0, 0, 2000, 2000));

        this.scale = 1;
        //  this.layer0.attr("id", "main");
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

        if (this.radarDefinition.config.showItemsList) {
            //  this.drawListing();
        }
        this.itemDescription = this.s.g();

        this.itemDescription.show = function (title, desc, x, y) {
            var t = this;


            t.selectAll("text").remove();
            var ctt = _this.s.multitext(0, 0, title, 700 * _this.scale, { "font-size": (30 * _this.scale) + "px" });
            var ct = _this.s.multitext(0, 50 * _this.scale, desc, 700 * _this.scale, { "font-size": (25 * _this.scale) + "px" });
            t.add(ctt, ct);
            t.attr('transform', 't' + (x * _this.scale) + ',' + (y * _this.scale));

        }
    }

    update() {
        var _this = this;
        _this.dr = null;

        this.updateListeners.forEach(function (fn) {
            fn(_this.radarDefinition);
        });
        _this.create(_this.size, _this.radarDefinition);
    }

    remove(item:RadarDataItemDef)
    {
       _.forEach(this.radarDefinition.data, function(x:RadarDataItem)
       {
           debugger;
           _.remove(x.data, function(s){ return s == item });
       });
       this.update();
    }
    add(item: RadarDataItemDef, x, y, slice: RadarSlice, initBounce: boolean = false) {
        var _this = this;
        var dragObj = { matrix: { e: {}, f: {} } };
        var g = this.s.g();
        var moved = false;

        var move = function (dx, dy) {
            dx *= 2000 / window.innerWidth / _this.scalar;
            dy *= 2000 / window.innerWidth / _this.scalar;
            //_this.itemDescription.attr({ "display": "none" });

            if (dx != 0 || dy != 0)
                moved = true;
            this.attr({
                transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
            });
        }

        var start = function (e, f) {
            _this.lockRadarMove = true;
            _this.layer2.attr({ display: "block" });
            dragObj = this;
            moved = false;

            this.data('origTransform', this.transform().local);
        }

        var stop = function () {
            _this.lockRadarMove = false;
            _this.layer2.attr({ display: "none" });
            if (!moved) {
                if (_this.editItem) {

                    debugger;
                    _this.editItem(item);
                    return;
                }
            };


            var x = <number>dragObj.matrix.e;
            var y = <number>dragObj.matrix.f;

            _this.dr = dragObj;

            if (_this.dr) {
                _this.moveToSlice(x, y, <RadarDataItemDef>_this.dr.radarItem);
            }
        }

        item.size = item.size || 4;
        item.color = item.color || '#FF0000';

        var c = this.s.g(); //this.s.circle(0, 0, item.size);

        g.add(c);


        this.loadExternal(item.shape || 'circle.svg', function (d) {
            c.add(d);
            d.attr({
                fill: item.color,
                'fill-opacity': 1,
                stroke: "#FFFFFF",
                strokeWidth: 0.5,
            });
            d.transform('s' + item.size / 5);
            g.add(c);

        });

        var threshold = _this.scalar * item.size > 6;
        if (threshold || item.alwaysShowTitle)
            var ct = this.s.multitext(6 + item.size, 5, item.title, 150, { "font-size": Math.max(12 / _this.scalar, 10) + "px", "fill": this.colorHelper.contrastColor(slice ? slice.color : '#FFFFFF') });

        if (!_this.radarAnimation)
            g.transform('t' + x + ',' + y);
        g.add(c);

        if (threshold|| item.alwaysShowTitle)
            g.add(ct);

        g.radarItem = _.cloneDeep(item);

        if (!this.readOnly) {
            g.drag(move, start, stop);
            g.attr({ 'cursor': 'move' });
        }
        else {
            g.click(function () {
                if (!_this.mapMoved && _this.editItem) {
                    _this.editItem(item);
                }
            });

        }
        this.layer0.add(g);

        c.hover(function () {

            //setTimeout(function() {g.locked =false;}, 1000);          
            Snap.animate(1, 2, function (val) {

                c.transform('s' + val);
            }, 1000, mina.elastic, function () {

            });

        }, function () {
            if (_this.lockRadarMove)
                return;

            Snap.animate(2, 1, function (val) {

                c.transform('s' + val);
            }, 1000, mina.bounce);

        });
        if (_this.radarAnimation) {
            Snap.animate(0, 100, function (val) {
                var nx = (_this.centre.x - (_this.centre.x * val / 100)) + (x * val / 100);
                var ny = (_this.centre.y - (_this.centre.y * val / 100)) + (y * val / 100);
                g.transform('t' + nx + ',' + ny);
            }, 1000, mina.bounce);
        } else {

        }
        return g.radarItem;

    }
  

    moveToSlice(x: number, y: number, radarItem :RadarDataItemDef) {
debugger;
        var _this = this;

        var slice =
            _.find(_this.radarDefinition.data, function (e: RadarDataItem) {
                return e.sliceId == _this.radarDefinition.config.slices[_this.currentElem.slicei].id;
            });

        if (!slice) {
            slice = {
                sliceId: _this.radarDefinition.config.slices[_this.currentElem.slicei].id,
                data: []
            };
            _this.radarDefinition.data.push(slice);

        }

        var newItem = radarItem;

        if (newItem.stageId != _this.currentElem.stagei) {
            var oldS =
                _.find(_this.radarDefinition.config.stages, function (e: RadarStage) {
                    return e.id == newItem.stageId;
                });
            var newS =
                _.find(_this.radarDefinition.config.stages, function (e: RadarStage) {
                    return e.id == _this.currentElem.stagei;
                });

            var hi = new HistoryItem();
            hi.date = new Date();
            if (oldS)
                hi.log = "Move from " + oldS.name + " to " + newS.name;
            else
                hi.log = "Added as " + newS.name;

            hi.x = newItem.x;
            hi.y = newItem.y;

            if (!newItem.history) {
                newItem.history = new Array<HistoryItem>();
            }
            newItem.history.push(hi);
        }

        newItem.stageId = _this.currentElem.stagei;
        newItem.x = x;
        newItem.y = y;

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
      //  _this.dr.attr({ display: "" });
        _this.updateListeners.forEach(function (fn) {
            fn(_this.radarDefinition);
        });

    

        _this.create(_this.size, _this.radarDefinition);

        var target = _this.currentElem;
        var stroke = target.e.attr("stroke");
        debugger;
        var hexColor= _this.colorHelper.rgbStrToHex(stroke);

        var isBright = _this.colorHelper.isBright(hexColor);

        var rgb = _this.colorHelper.hexToRgb(hexColor);

        var sign = isBright ? -1 : 1;
        Snap.animate(1, 50, function (val) 
        {
            rgb.r += 1*sign;
            rgb.g += 1*sign;
            rgb.b += 1*sign;

            target.e.attr({ "stroke": 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')' }) }, 500, mina.linear,
            function () {
                
                Snap.animate(1, 50, function (val) 
                {
                    rgb.r -= 1*sign;
                    rgb.g -= 1*sign;
                    rgb.b -= 1*sign;
                     target.e.attr({ "stroke": 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')' }) }, 500, mina.linear,
                function () {
                        target.e.attr({"stroke": stroke});
                    });
            }
        );
    }

    loadSvgFromCache(name: string) {
        var k = "/assets/svg/" + name;
        if (this.cache[k]) {
            return _.cloneDeep(this.cache[k]);
        }
        return null;
    }
    loadExternal(name: string, doneCallback) {
        var k = "/assets/svg/" + name;
        if (this.cache[k]) {
            doneCallback(this.cache[k].clone());
            return;
        }
        var _this = this;
        Snap.load(k, function (f) {
            var layer0 = f.select("#gr");
            _this.cache[k] = layer0;
            doneCallback(layer0);

        });
    }

    draw(percent, radius, color, maxOpacity, width, animation) {
        var arc = this.s.path("");
        var startY = this.centre.y - radius;
        var endpoint = percent * 360;

        width -= 2;
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
            'stroke-opacity': animation ? 0 : maxOpacity / 100,
            strokeWidth: width,
        });
        console.log("width:" + width);
        if (animation) {
            Snap.animate(0, maxOpacity, function (val) {
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

    drawRing(parts: any, radius: any, width: any, oncreated: any, color: any, stageIndex: number) {

        let rotSum: number = 0;
        for (var i = 0; i < parts; i++) {

            var rot = 360 * (this.radarDefinition.config.slices[i].perc / 100); //(360 / parts);

            var col = color || this.radarDefinition.config.slices[i].color || '#EEEEEE';
            //col = this.colorLuminance(col, stageIndex/this.radarDefinition.config.stages.length);
            var opacity = (0.5 + (0.5 * stageIndex / this.radarDefinition.config.stages.length)) * 100;
            var c2 = this.draw(this.radarDefinition.config.slices[i].perc / 100, radius, col, opacity, width, this.radarAnimation);
            this.layer1.add(c2);
            c2.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);

            var c3 = this.draw(this.radarDefinition.config.slices[i].perc / 100, radius, 'transparent', opacity, width, this.radarAnimation);
            c3.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            this.layer2.add(c3);

            var c4 = this.draw(this.radarDefinition.config.slices[i].perc / 100, radius, 'transparent', opacity, width, this.radarAnimation);
            c4.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            this.layer4.add(c4);

            rotSum += rot;
            oncreated(i, c2, c3, c4);
        }


    }

    colorLuminance(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    }

    write(text, x, y) {
        this.t.remove();
        this.t = this.s.text(x || 100, y || 50, text);
    }

    init() {
        var slicesLength = this.radarDefinition.config.slices.length;
        var stagesLength = this.radarDefinition.config.stages.length;
        var _this = this;

        var current = null;
        this.map = {};

        this.drawRing(slicesLength, _this.radius + (35), 30, function (sliceIndex, elem) {
            var l = elem.getTotalLength();
            var t1 = _this.s.paper.text((l / 2), 100, _this.radarDefinition.config.slices[sliceIndex].name).attr(
                {
                    textpath: elem,
                    'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.0,
                    "font-size": "15px",
                    "text-anchor": "middle",

                    "font-family": "Arial"
                });
            _this.layer1.add(t1);
        }, "#FFFFFF", 0);

        var rSum = 0;
        for (var i = 0; i < stagesLength; i++) {
            // _this.radius = this.canvasSize / 2.5;
            var ringWidth = _this.radius * (_this.radarDefinition.config.stages[i].perc / 100);
            var shift = ringWidth / 2;

            this.drawRing(slicesLength, _this.radius - (rSum) - shift, ringWidth, function (sliceIndex, elem, elemMirror, elemMirror2) {
                //oncreated

                var slice = _this.radarDefinition.config.slices[sliceIndex];
                var key = _this.radarDefinition.config.slices[sliceIndex] + '|' + _this.radarDefinition.config.stages[i];
                var stagei = _this.radarDefinition.config.stages[i].id;

                var l = elem.getTotalLength();
                var size = 20;
                if (l < 40) size = 15;
                if (l < 20) size = 5;
                // if(l < 20) size = 10;
                //console.log('L: ' + l);
                var t1 = _this.s.paper.text(l / 2, 0, _this.radarDefinition.config.stages[i].name).attr(
                    {
                        textpath: elem,
                        'fill': '#DDDDDD', 'stroke': '#515151', 'stroke-width': 0.0,
                        "font-size": size + "px",
                        "text-anchor": "middle",
                        "font-family": "Arial"
                    });
                _this.layer1.add(t1);

                // remember current elem after radar recreate
                if(_this.currentElem && _this.currentElem.slicei == sliceIndex && _this.currentElem.stagei == stagei)
                {
                    _this.currentElem.e = elem;
                }

                var detectElem = function () {
                    _this.currentElem = {
                        e: elem,
                        slicei: sliceIndex,
                        stagei: stagei,
                        x: 0,
                        y: 0
                    };

                    console.log(_this.currentElem.slicei + ' ' + _this.currentElem.stagei);
                    current = _this.map[key];
                    current.attr({ 'origStroke': current.attr('stroke') });
                }


                elemMirror2.click(function () {

                    if (!_this.mapMoved) {
                        if (_this.editItem) {
                            console.log('add item');
                            if(!_this.readOnly)
                            _this.editItem();
                            return;
                        }
                    };

                });

                elemMirror2.hover(detectElem, function () {
                    current = _this.map[key];
                });

                elemMirror.hover(detectElem, function () {
                    current = _this.map[key];
                });
                _this.map[key] = elem;
            }, null, i);
            var f = this.s.paper.filter(Snap.filter.blur(0.1, 0.1));
            var c = this.s.paper.circle(this.centre.x, this.centre.y, _this.radius - (rSum)).attr({

                strokeWidth: 1,
                fill: "none",
                stroke: "#AAAAAA",
                strokeLinecap: "round",
                filter: f,
            });
            this.layer0.add(c);
            rSum += ringWidth;
        }

        var rotSum = 0;
        for (var i = 0; i < slicesLength; i++) {
            var rot = this.radarDefinition.config.slices[i].perc * 360 / 100;

            var line = this.s.paper.line(this.centre.x, this.centre.y, this.centre.x, this.centre.y - _this.radius - 100).attr(
                {
                    stroke: "#AAAAAA",
                });
            line.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            this.layer1.add(line);
            rotSum += rot;
        }

        var obj = _this.radarDefinition.data;

        _.forEach(obj, function (slElems: RadarDataItem) {

            var sliceId = slElems.sliceId;
            _.forEach(slElems.data, function (obj) {
                var ind = _.find(_this.radarDefinition.config.slices, function (e) { return e.id == sliceId })
                _this.add(obj, obj.x * _this.scale, obj.y * _this.scale, ind);
            });
        });



        return this;
    }

}


TechRadar.prototype.proto = <RadarDefinition>
    { "key": "-KxbVnVJ7kodlI4VbBwV", "config": { "title": "My New Radar", "updateDate": "", "contact": "", "showItemsList": false, "slices": [{ "id": 1, "name": "Tools/Technologies", "perc": 33.33, "color": "#feffd7" }, { "id": 2, "name": "Languages", "perc": 33.33, "color": "#d2ffd2" }, { "id": 3, "name": "Practices", "perc": 33.33, "color": "#ffdddd" }], "stages": [{ "id": 1, "name": "On Hold", "perc": 20 }, { "id": 2, "name": "Assess", "perc": 20 }, { "id": 3, "name": "Trial", "perc": 20 }, { "id": 4, "name": "Adopted", "perc": 40 }] }, "data": [{ "sliceId": 1, "data": [] }, { "sliceId": 2, "data": [] }, { "sliceId": 3, "data": [] }] };











