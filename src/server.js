var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    io = require('socket.io'),
    socket, server, send404, contentTypes;


contentTypes = {
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.manifest': 'text/cache-manifest',
  '.js': 'text/javascript'
};


server = http.createServer(
  function(req, res) {
    // your normal server code
    var pathname = url.parse(req.url).pathname;
    switch (pathname){
      case '/':
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Welcome. Try the <a href="/chat.html">chat</a> example.</h1>');
        res.end();
        break;

      default:
        fs.readFile(__dirname + pathname, function(err, data){
          var type = 'text/html',
              ext  = path.extname(pathname);
              
          console.log('[GET] ' + pathname);

          if (err) {
            return send404(res);
          }
          
          if (ext in contentTypes) {
            type = contentTypes[ext];
          }
          
          res.writeHead(200, {'Content-Type': type})
          res.write(data, 'utf8');
          res.end();
        });
        break;
    }
  }
);

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};


server.listen(8124);

socket = io.listen(server);

socket.on('connection', function(client) {
  client.on('message', function(message){
    console.log(message);
    socket.broadcast(message, client.sessionId);
  });
  
  client.on('disconnect', function(){
    
  });
});