YUI({
  filter: 'debug',
  modules: {
    'socket.io': {
      fullpath: '/socket.io/socket.io.js'
    }
  }
}).use(
  'widget', 'base', 'plugin', 'event', 'event-touch', 
  'dom', 'node', 'socket.io', function(Y) {

  
  var socket = new io.Socket(null, {port: 8124, rememberTransport: false});
  socket.connect();
  
  
  
  Y.SketchPad = function(config) {
    Y.SketchPad.superclass.constructor.apply(this, arguments);
  };

  Y.SketchPad.NAME = 'sketchpad';
  
  Y.SketchPad.ATTRS = {
    layers: {
      getter: function(){
        return this.get('contentBox').all('canvas');
      }
    },
    
    drawing: {
      value: false,
      
      setter: function(val) {
        if (true == val) {
          this._bindMoveEvent();
        }
        else {
          this._unbindMoveEvent();
        }
        
        this._isDrawing = val;
      },
      
      getter: function() {
        return this._isDrawing;
      }
    },
    
    offsets: {
      setter: function(xy) {
        this._boardOffsets = xy;
      },
      
      getter: function() {
        return this._boardOffsets;
      }
    },

    xOffset: {
      readOnly: true,
      getter: function() {
        return this._boardOffsets[0];
      }
    },

    yOffset: {
      readOnly: true,
      getter: function() {
        return this._boardOffsets[1];
      }
    }
  };

  Y.extend(Y.SketchPad, Y.Widget, function(){
    function getTouch(event) {
      return 'touches' in event ? event.touches[0] : event;
    };

    return {
      _isDrawing: false,
      
      _boardOffsets: [0, 0],
      
      initializer: function() {
        Y.on('orientationchange', Y.bind(this._onOrientationChange, this), window);
        
        this.on('touchmove', function(event) {
          event.preventDefault();
        })
        
        this._onOrientationChange();
      },
      
      bindUI: function() {
        var boundingBox = this.get("boundingBox"),
            initPaintEvents = ['touchstart','mousedown'],
            endPaintEvents = ['touchend','mouseup'],
            doPaintEvents = ['touchmove','mousemove'];
        
        Y.on(initPaintEvents, Y.bind(this._onTouchStart, this), boundingBox);
        Y.on(endPaintEvents, Y.bind(this._onTouchEnd, this), boundingBox.get('ownerDocument'));
        
        this._doPaintHandler = Y.bind(this._onTouchMove, this);
      },
      
      _bindMoveEvent: function() {
        if (!this._moveListener) {
          this._moveListener = Y.on(['touchmove','mousemove'], this._doPaintHandler, this.get('boundingBox'));
        }
      },
      
      _unbindMoveEvent: function() {
        if (this._moveListener) {
          var boundingBox = this.get('boundingBox');
          
          Y.Event.purgeElement(boundingBox, false, 'touchmove');
          Y.Event.purgeElement(boundingBox, false, 'mousemove');
          
          delete this._moveListener;
        }
      },
      
      _onTouchStart: function(event) {
        this.set('drawing', true);
        
        var _ref, touch;
        touch = getTouch(event);
        _ref = [touch.pageX - this.get('xOffset'), touch.pageY - this.get('yOffset')];
        x = _ref[0];
        y = _ref[1];
        return event.preventDefault();
      },
      
      _onTouchMove: function(event) {
        if (this.get('drawing')) {
          var touch = getTouch(event);
          return points.push([touch.pageX - this.get('xOffset'), touch.pageY - this.get('yOffset')]);
        }
      },
      
      _onTouchEnd: function(event) {
        this.set('drawing', false);

        return points.push([x, y], [x, y], null);
      },
      
      _onOrientationChange: function(event) {
        var xy = this.get('boundingBox').getXY();
        
        this.set('offsets', xy);
      },
      
      renderUI: function(){

      },
      
      syncUI: function() {
        var boundingBox = this.get('boundingBox'),
            get = function(key) {
              return parseInt(boundingBox.getStyle(key), 10);
            };

        this.get('layers')
            .set('width', get('width'))
            .set('height', get('height'));
      },
      
      getLayer: function(index) {
        return this.get('layers').item(index || 0);
      },
      
      getCanvas: function(){
        return this.getLayer(0)._node.getContext('2d');
      }
      
    };
  }());

  
  canvas = new Y.SketchPad({
    contentBox: '#board > .board',
    boundingBox: '#board',
  });
  canvas.render();
  
  

  context = canvas.getCanvas();
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "miter";
  context.strokeStyle = 'rgba(200,200,200,1)';  
  
  

  
  
  
  
  
  
  
  
  
  
  
  /* Drawing */
  skip = false;
  count = 0;
  points = [null];
  x = (y = null);
  draw = function(point) {
    var _ref;
    if (point) {
      if (skip) {
        return (skip = false);
      } else {
        if (!isNaN(x) && !isNaN(y)) {
          socket.send(JSON.stringify({
            from: [x,y],
            to:   point
          }));
        }
        var from = [x,y];
        _ref = point;
        x = _ref[0];
        y = _ref[1];
        return doDraw(from, point);
      }
    } else {
      return (skip = true);
    }
  };
  
  doDraw = function(from, to) {
    context.moveTo(from[0], from[1]);

    return context.lineTo(to[0], to[1]);
  };
  
  socket.on('message', function(obj) {
    var item = JSON.parse(obj),
        list = (item && item.from) ? [item] : item;

    context.beginPath();
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (item.to[0] != null && item.to[1] != null) {
        doDraw(item.from, item.to);
      }
    }
    context.stroke();
  });
  
  
  setInterval(function() {
    var start;
    if (!(points.length)) {
      return null;
    }
    
    start = new Date();
    context.beginPath();
    
    while (points.length && new Date() - start < 10) {
      draw(points.shift());
    }
    return context.stroke();
  }, 30);
   
});