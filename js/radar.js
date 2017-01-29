
class TechRadar {
    
  constructor() {
          this.s =  Snap('#radar'); 
          this.radarAnimation = true;
          this.t = this.s.text(10,10, "text");
     
       this.updateListeners = [];
       this.colors = 
[
    '#ffffff',
    '#ffffff',
    '#ffffff',
    '#ffffff',
    '#ffffff',
];

 this.create(1000, radarDefinition);
   this.radarAnimation = false;

   
        
  }

  addUpdateListener(fn)
  {
      this.updateListeners.push(fn);
  }
  
  create(size, radarDef)
  {
    this.s.clear();
    this.map = {};
    this.data = radarDef;
    this.canvasSize = size;
    this.radius = this.canvasSize / 2.5;
    this.centre = this.canvasSize/2;
    this.init();
  }

  add(name, x, y, color) 
  {
    var _this = this;
    var dragObj = {};
    var move = function(dx,dy) {
            this.attr({
                        transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
                    });
    }

    var start = function() {
           dragObj = this;
            this.data('origTransform', this.transform().local );
    }

    var stop = function() {
        var x = dragObj.matrix.e;
        var y = dragObj.matrix.f;
        _this.dr = dragObj;

    _this.dr.attr({ display : "none" });

    }

      var c = this.s.circle(0,0,4);
  c.attr({
    fill: color,
    'fill-opacity': 0.5,
    stroke: "#050505",
    strokeWidth: 1
});
      var ct = this.s.text(0 + 10, 5, name);
      var g = this.s.g();
      if(!_this.radarAnimation)
      g.transform('t' + x + ',' + y);
      g.add(c, ct);
      g.radarItem = 
      {
          title: name,
          desc: '',
      };
      g.drag(move, start, stop);
      g.attr({'cursor': 'move'});
      g.hover(function()
      {
              
              Snap.animate(1, 2,   function (val) {
               c.transform('s' + val);
              }, 500, mina.bounce);
          
      },function()
      {
              Snap.animate(2, 1,   function (val) {
               c.transform('s' + val);
              }, 500, mina.bounce);
          
      });
   if(_this.radarAnimation)
   {
   Snap.animate(0, 100,   function (val) {
       var nx = (_this.centre-(_this.centre*val/100)) + (x*val/100);
       var ny = (_this.centre-(_this.centre*val/100)) + (y*val/100);
       g.transform('t' + nx+ ',' + ny);
       
    
    }, 500, mina.linear);
   }else
   {
    
   }  
      
  }

  draw(percent, radius, color, width) {
    var arc = this.s.path("");
    var startY = this.centre-radius;
    var endpoint = percent *360;

        var d = endpoint,
            dr = d-90,
            radians = Math.PI*(dr)/180,
            endx = this.centre + radius*Math.cos(radians),
            endy = this.centre + radius * Math.sin(radians),
            largeArc = d>180 ? 1 : 0,
            path = "M"+this.centre+","+startY+" A"+radius+","+radius+" 0 "+largeArc+",1 "+endx+","+endy;
 
        arc = this.s.path(path);
        arc.attr({
          stroke: color,
          fill: 'none',
          'stroke-opacity': this.radarAnimation ? 0 : 1,
          strokeWidth: width - 1
        });
     
    if(this.radarAnimation)
   {
   Snap.animate(0, 100,   function (val) {
      arc.attr({
          'stroke-opacity': (val/100)
        });
    
    }, 100 + (radius*5), mina.easeinout);  
    Snap.animate(0, width-1,   function (val) {
      arc.attr({
          'strokeWidth': val
        });
    
    }, 100 + (radius*5), mina.backout);
   }  
    return arc;
}

drawRing(parts, radius, width, oncreated, color)
{
    var rot = 360/parts;
    for(var i=0;i<parts;i++)
    {
        var c2 = this.draw(1/parts, radius, color || this.colors[i], width);
        c2.transform('r' + (rot*i) +','+ this.centre +','+this.centre);
        oncreated(i, c2);   
    }
}

write(text, x, y)
{
    this.t.remove();
    this.t = this.s.text(x || 100, y || 50,text);
}

init()
{
var slicesLength = radarDefinition.config.slices.length;
var stagesLength = radarDefinition.config.stages.length;
var _this = this;

var current = null;
this.map = {};

 var title = _this.s.paper.text(this.centre, 50, _this.data.config.title + ' (' + _this.data.config.updateDate + ')').attr(
            {        'fill' : '#000000',  'stroke': '#000000', 'stroke-width': 0.2,
             "font-size": "15px",
             "text-anchor":"middle" });

  _this.s.paper.text(730, 15, 'contact: ' + _this.data.config.contact).attr(
            {        'fill' : '#000000',  'stroke': '#000000', 'stroke-width': 0.2,
             "font-size": "15px",
             "text-anchor":"start" });

 this.drawRing(slicesLength, _this.radius+(20), 35, function(sliceIndex, elem)
    {
       var l = elem.getTotalLength();
        var t1 = _this.s.paper.text(l/2, 0, _this.data.config.slices[sliceIndex]).attr(
            {textpath: elem,
             'fill' : '#000000',  'stroke': '#000000', 'stroke-width': 0.2,
             "font-size": "15px",
             "text-anchor":"middle" });
    }, "#DDDDDD");


var rSum= 0;
for(var i=0;i<stagesLength;i++)
{
      _this.radius = this.canvasSize / 2.5;
var ringWidth = _this.radius * _this.data.config.stages[i].scale;
var shift = ringWidth/2;

    this.drawRing(slicesLength, _this.radius-(rSum)-shift, ringWidth, function(sliceIndex, elem)
    {
        //oncreated

        var slice = radarDefinition.config.slices[sliceIndex];
        var key = radarDefinition.config.slices[sliceIndex] + '|' + radarDefinition.config.stages[i];
        var stagei = radarDefinition.config.stages[i].name;
     
        var l = elem.getTotalLength();
        var t1 = _this.s.paper.text(l/2, 0, _this.data.config.stages[i].name).attr(
            {textpath: elem,
            'fill' : '#EEEEEE',  'stroke': '#EEEEEE', 'stroke-width': 0.2,
             "font-size": "20px",
             "text-anchor":"middle" });
      //  t1.transform('r' + (360/slicesLength*i) + ',' + _this.centre + ',' + _this.centre);

        elem.hover(function()
        {
            current = _this.map[key];
            current.attr( { 'origStroke': current.attr('stroke') } );
            
            //_this.write(key);
            if(_this.dr && _this.dr.attr('display') == "none")
            {
                var slice = 
                _.find(_this.data.data, function(e)
                {
                    return e.slice == _this.data.config.slices[sliceIndex]; 
                });
                
                if(!slice)
                {
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

                _.forEach(radarDefinition.data, function(sliceElem)
                {
                    var existing =
                    _.findIndex(sliceElem.data, function(b){return b.title == newItem.title});

                    if(existing >= 0)
                    {
                      sliceElem.data.splice(existing, 1);
                    }
                });
                
                var dx = _this.centre - newItem.x;
                var dy = _this.centre - newItem.y;
                if(Math.sqrt(dx*dx+dy*dy) <= _this.radius)
                  {
                    slice.data.push(newItem);
                  }
                    _this.dr.attr({ display : "" });
                        _this.updateListeners.forEach(function(fn){
                        fn(_this.data);
                        });

                    Snap.animate(255, 240, function (val) { elem.attr({"stroke": 'rgb('+val+','+val+','+val+')' })}, 300, mina.linear,
                    function()
                    {
                    Snap.animate(240, 255, function (val) { elem.attr({"stroke": 'rgb('+val+','+val+','+val+')' })}, 300, mina.linear,
                    function()
                    {
                        _this.create(1000, _this.data);
                    });
                    }
                    );

            }          

        },function()
        {
            current = _this.map[key];
            
            

       //     current.attr({ stroke: '#ff0000'});
        });
        _this.map[key] = elem;
    });

    rSum+= ringWidth;
}

for(var i=0;i<slicesLength; i++)
{
    var line = this.s.paper.line(this.centre, this.centre, this.centre, this.centre - _this.radius).attr({strokeWidth:1,stroke:"#cccccc",strokeLinecap:"round"});
    line.transform('r' + (360/slicesLength*i) + ',' + this.centre + ',' + this.centre);
}



var obj = _this.data.data;
var cols =  
[
  '#ff0000',
  '#00ff00',
  '#0000ff',
];

_.forEach(obj, function(slElems)
{
    var slice = slElems.slice;
    _.forEach(slElems.data, function(obj)
    {
        var ind = _.findIndex(_this.data.config.slices, function(e){ return e == slice})
        
       _this.add(obj.title, obj.x, obj.y, cols[ind]); 
    });
});



return this;
}
  
}


 







