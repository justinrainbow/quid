YUI({
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
  
  
  var Toolbox = function(config) {
    Toolbox.superclass.constructor.apply(this, arguments);
  };
  
  Toolbox.NS = 'toolbox';
  
  Toolbox.NAME = 'toolboxPlugin';
  
  Toolbox.ATTRS = {
    
  };
  
  Y.extend(Toolbox, Y.Plugin.Base, {
    
  });
  
  
	board  = Y.get('#board');
  canvas = Y.one("#canvas");
  output = Y.one("#output");

  canvas.set("width", parseInt(board.getStyle('width')));
  canvas.set("height", parseInt(board.getStyle('height')));
  
  xOffset = (yOffset = 0);

  context = canvas._node.getContext("2d");
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "miter";
  context.strokeStyle = 'rgb(200,200,200)';  
  
  
  
  updateOffsets = function() {
    xOffset = board.getX();
    return (yOffset = board.getY());
  };
  
  window.addEventListener("orientationchange", updateOffsets);
  updateOffsets();
  
  
  window.addEventListener("touchmove", function(event) {
    return event.preventDefault();
  });
  
  
  
  
  
  
  
  
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
    var item = JSON.parse(obj);

    context.beginPath();
    if (item.to[0] != null && item.to[1] != null) {
      doDraw(item.from, item.to);
    }
    context.stroke();
  });
  
  var clickDown = false;
  function getTouch(event) {
    if (clickDown !== true) {
      return false;
    }
    return 'touches' in event ? event.touches[0] : event;
  };
  
  
  
  
  canvas.on(["touchstart", "mousedown"], function(event) {
    var _ref, touch;
    clickDown = true;
    touch = getTouch(event);
    _ref = [touch.pageX - xOffset, touch.pageY - yOffset];
    x = _ref[0];
    y = _ref[1];
    return event.preventDefault();
  });
  
  canvas.on(["touchmove", "mousemove"], function(event) {
    var touch;
    touch = getTouch(event);
    return points.push([touch.pageX - xOffset, touch.pageY - yOffset]);
  });
  
  canvas.on(["touchend", "mouseup"], function(event) {
    clickDown = false;
    return points.push([x, y], [x, y], null);
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