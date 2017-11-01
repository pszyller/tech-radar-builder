import {RadarDefinition,RadarSlice,RadarStage,RadarDataItem,RadarDataItemDef, HistoryItem} from './radar-definition';
import * as _ from "lodash";
import { Observable, Observer } from "rxjs/"
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
    lockRadarMove:boolean;
    onItemStageChange: any;
    group: any;
    scalar:number = 1;
    proto:RadarDefinition;
    cache:{} = new Object();

    constructor(radarData, scale, readOnly:boolean) {
        
        this.readOnly = readOnly;
        var radarDefinition : RadarDefinition;
      
        radarDefinition = _.cloneDeep(TechRadar.prototype.proto);
        
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
          //      transform: 's' + this.scale,
                viewBox: "0,0," + this.vbSize + "," + this.vbSize,
            });
            
            
            var _this = this;
            this.s.mousemove( function(ev,x,y,c,b)
            {
                if(ev.buttons > 0 && !_this.lockRadarMove)
                {
                    _this.group.transform('S'+_this.scalar+' 0 0 T' + (_this.group.matrix.e + ev.movementX) + ',' + (_this.group.matrix.f + ev.movementY));
                }
            } );

            if( (/Firefox/i.test(navigator.userAgent)) ) {
                this.s.node.addEventListener("DOMMouseScroll", mouseWheelHandler, false);
            } else {
                this.s.node.addEventListener("mousewheel", mouseWheelHandler, false);
            }
            
            function mouseWheelHandler (ev) { 
                ev.preventDefault();
                
                if(ev.deltaY < 0)
                {
                    if(_this.scalar < 3.5)
                    _this.scalar-= ev.deltaY/1000;
                    else
                    return;
                }
                else
                {
                    if(_this.scalar > 0.5)
                    _this.scalar-= ev.deltaY/1000;
                    else
                    return;
                }
                console.log('scale: ' + _this.scalar);


                _this.group.transform('s'+_this.scalar+' 0 0 T' + (_this.group.matrix.e + ev.deltaY) + ',' + (_this.group.matrix.f + ev.deltaY));
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
       this.scale+=0.1;
    }

    addUpdateListener(fn) {
        this.updateListeners.push(fn);
    }

    create(size, radarDef) {
        var _this = this;
        var saveTransform = 'S'+ this.scalar+' 0 0 T0,0';

        
        if(this.s.select("#main"))
        {
           saveTransform = this.s.select("#main").attr('transform').string;
        }
        
        this.s.clear();
        this.group = this.s.paper.g()
        this.group.attr('transform', saveTransform);
        //this.group.attr('transform', 'S'+ this.scalar+' 0 0 T0,0');
        this.scale = 1;
        this.group.attr("id", "main");
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

    update(item:RadarDataItemDef, oldName:string)
    {
        var _this = this;
        _this.dr = null;

        this.updateListeners.forEach(function (fn) {
                            fn(_this.radarDefinition);
                        });
      _this.create(_this.size, _this.radarDefinition);
    }

    add(item : RadarDataItemDef, x, y, color, initBounce : boolean = false) {
        var _this = this;
        var dragObj = { matrix: { e: {}, f: {} } };
        var g = this.s.g();
        var moved = false;

        var move = function (dx, dy) {
            dx *= 2000 / window.innerWidth / _this.scalar;
            dy *= 2000 / window.innerWidth /  _this.scalar;
            //_this.itemDescription.attr({ "display": "none" });
           
           if(dx > 0 || dy > 0)
            moved = true;
            this.attr({
                transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
            });
        }

        var start = function (e,f) {
            _this.lockRadarMove = true;
            dragObj = this;
            moved = false;
              
            this.data('origTransform', this.transform().local);
        }

        var stop = function () {
            _this.lockRadarMove = false;
            
            if(!moved)
            {
                if(_this.editItem)
                {
                
                   _this.editItem(item);
                   return;
                }
            };
            

            var x = dragObj.matrix.e;
            var y = dragObj.matrix.f;
            _this.dr = dragObj;

            _this.dr.attr({ display: "none" });
        }
        item.size = item.size|| 4;
        item.color = item.color|| '#FF0000';

        var c = this.s.g(); //this.s.circle(0, 0, item.size);
               
        this.group.add(c);
            
        this.loadExternal(item.shape || 'circle.svg',  function(d){
          c.add(d);
            d.attr({
                fill: item.color,
                'fill-opacity': 1,
                stroke: "#FFFFFF",
                strokeWidth: 0.5,
            });
            d.transform('s'+item.size/5);
            g.add(c);

        });
    
        
        // if(initBounce)
        // {
        // Snap.animate(600, 100, function (val) {
        //         c.transform('s' + (val/100));
        //     }, 500, mina.elastic);
        // }

        var threshold = _this.scalar * item.size > 6;
        if(threshold)
        var ct = this.s.multitext(6 + item.size, 5, item.title, 150, { "font-size": Math.max(12 / _this.scalar, 10) + "px", "color": this.contrastColor(item.color) });
        
        if (!_this.radarAnimation)
            g.transform('t' + x + ',' + y);
        g.add(c);
        
        if(threshold)
        g.add(ct);

        g.radarItem = _.cloneDeep(item);
            
        if (!this.readOnly) {
            g.drag(move, start, stop);
            g.attr({ 'cursor': 'move' });
        }
        else
        {
            g.click(function()
            {
                if(_this.editItem)
                {
                    
                   _this.editItem(item);
                }
            });
             
        }
        this.group.add(g);
        g.hover(function () {
            //  _this.itemDescription.attr({x: g.matrix.e, y:g.matrix.f - 250, "display": ""});
          //  _this.itemDescription.show(g.radarItem.title, g.radarItem.desc, 50, 150);
            
            Snap.animate(1, 2, function (val) {
               
                c.transform('s' + val);
            }, 1000, mina.elastic, function()
            {
               
            });

        }, function () {
            //_this.itemDescription.attr({ "display": "none" });

            Snap.animate(c.matrix.d, 1, function (val) {
          
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

    }
  
    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }
    

    contrastColor(color)
    {
        var d = 0;
    
        // Counting the perceptive luminance - human eye favors green color... 
        var a = 1 - ( 0.299 * color.R + 0.587 * color.G + 0.114 * color.B)/255;
    
        if (a < 0.5)
           d = 0; // bright colors - black font
        else
           d = 255; // dark colors - white font
    
        return  this.rgbToHex(d, d, d);
    }


    loadExternal(name:string, doneCallback)
    {
        var k = "/assets/svg/"+name;
        if(this.cache[k])
        {
            doneCallback(_.cloneDeep(this.cache[k]));
        }
        var _this = this;
        Snap.load(k, function(f) {
            var layer0 = f.select("#gr");
            _this.cache[k] = layer0;
            doneCallback(layer0);
            
        });
    }

    draw(percent, radius, color, maxOpacity, width) {
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
            'stroke-opacity': this.radarAnimation ? 0 : maxOpacity/100,
            strokeWidth: width
        });

        if (this.radarAnimation) {
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
        this.group.add(arc);
        return arc;
    }

    drawRing(parts: any, radius: any, width: any, oncreated: any, color: any, stageIndex: number) {
        
        let rotSum:number = 0;
        for (var i = 0; i < parts; i++) {
            
            var rot = 360 * (this.radarDefinition.config.slices[i].perc/100); //(360 / parts);
            
            var col = this.radarDefinition.config.slices[i].color || '#EEEEEE';
            //col = this.colorLuminance(col, stageIndex/this.radarDefinition.config.stages.length);
            var opacity = (0.5 + (0.5 * stageIndex/this.radarDefinition.config.stages.length))*100;
            var c2 = this.draw(this.radarDefinition.config.slices[i].perc/100, radius, col, opacity, width);
            c2.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            rotSum +=rot;
            oncreated(i, c2);
        }
    }

    colorLuminance(hex, lum) {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
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
 
        this.drawRing(slicesLength, _this.radius + (15), 30, function (sliceIndex, elem) {
            var l = elem.getTotalLength();
            var t1 = _this.s.paper.text((l / 2), 100, _this.radarDefinition.config.slices[sliceIndex].name).attr(
                {
                    textpath: elem,
                    'fill': '#000000', 'stroke': '#000000', 'stroke-width': 0.0,
                    "font-size": "15px",
                    "text-anchor": "middle",
                    
                    "font-family": "Arial"
                });
            _this.group.add(t1);
        }, "#DDDDDD", 0);
    
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
                //console.log('L: ' + l);
                var t1 = _this.s.paper.text(l / 2, 0, _this.radarDefinition.config.stages[i].name).attr(
                    {
                        textpath: elem,
                        'fill': '#DDDDDD', 'stroke': '#515151', 'stroke-width': 0.0,
                        "font-size":  size + "px",
                        "text-anchor": "middle",
                        "font-family": "Arial"
                    });
                    _this.group.add(t1);
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

                        if(newItem.stageId != stagei)
                        {
                            var oldS =
                            _.find(_this.radarDefinition.config.stages, function (e: RadarStage) {
                                return e.id == newItem.stageId;
                            });
                            var newS =
                            _.find(_this.radarDefinition.config.stages, function (e: RadarStage) {
                                return e.id == stagei;
                            });

                            var hi = new HistoryItem();
                            hi.date = new Date();
                            if(oldS)
                            hi.log = "Move from " + oldS.name + " to " + newS.name;
                            else
                            hi.log = "Added as " + newS.name;

                            hi.x = newItem.x;
                            hi.y = newItem.y;
                          
                            if(!newItem.history)
                            {
                                newItem.history = new Array<HistoryItem>();
                            }
                          newItem.history.push(hi);
                        }

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
            }, '#FF000', i);
            var f = this.s.paper.filter(Snap.filter.blur(0.1, 0.1));
            var c = this.s.paper.circle(this.centre.x, this.centre.y, _this.radius - (rSum)).attr({
         
             strokeWidth: 1,
             fill: "none",
                     stroke: "#AAAAAA",
                   //  strokeLinecap: "round",
                        filter: f,
            });
            this.group.add(c);
            rSum += ringWidth;
        }

        var rotSum = 0;
        for (var i = 0; i < slicesLength; i++) {
            var rot = this.radarDefinition.config.slices[i].perc * 360 / 100;
            var f = this.s.filter(Snap.filter.blur(0.1, 0.1));
            var line = this.s.paper.line(this.centre.x, this.centre.y, this.centre.x, this.centre.y - _this.radius -100).attr(
                {
                     strokeWidth: 1,
                     stroke: "#AAAAAA",
                    // strokeLinecap: "round",
                     filter: f
                });
            line.transform('r' + rotSum + ',' + this.centre.x + ',' + this.centre.y);
            this.group.add(line);
            rotSum +=rot;
        }

        var obj = _this.radarDefinition.data;

        _.forEach(obj, function (slElems) {
            var sliceId = slElems.sliceId;
            _.forEach(slElems.data, function (obj) {
                //var ind = _.findIndex(_this.radarDefinition.config.slices, function (e) { return e.id == sliceId })
                _this.add(obj, obj.x * _this.scale, obj.y * _this.scale, '');
            });
        });



        return this;
    }

}


 TechRadar.prototype.proto = <RadarDefinition>
 {"key":"-KxbVnVJ7kodlI4VbBwV","config":{"title":"My New Radar","updateDate":"","contact":"","showItemsList":false,"slices":[{"id":1,"name":"Tools/Technologies","perc":33.33,"color":"#feffd7"},{"id":2,"name":"Languages","perc":33.33,"color":"#d2ffd2"},{"id":3,"name":"Practices","perc":33.33,"color":"#ffdddd"}],"stages":[{"id":1,"name":"On Hold","perc":20},{"id":2,"name":"Assess","perc":20},{"id":3,"name":"Trial","perc":20},{"id":4,"name":"Adopted","perc":40}]},"data":[{"sliceId":1,"data":[]},{"sliceId":2,"data":[]},{"sliceId":3,"data":[]}]};

 









