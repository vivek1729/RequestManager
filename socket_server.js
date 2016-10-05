var net = require('net');
var parser = require('http-string-parser');
var _ = require('lodash'); //Just cherry pick array methods
var querystring = require('querystring');

var arr = [];

var conObj = function(id,socket,timeout){
	this.id = id;
	this.socket = socket;
	this.completed = false;
	this.start = new Date().getTime();
	this.duration = timeout*1000;
	this.sendResponse = function(){
		this.completed = true;
    	this.socket.end(JSON.stringify({status: "ok"}));
	}
	this.timer = setTimeout(_.bind(this.sendResponse, this), timeout*1000);
}

function clean(){
	//Removes completed requests from queue
	_.remove(arr, function(n) {
	  	return n.completed == true;
	});
}
function findSocket(id){
  var matches = arr.filter(function(conn){
		return (conn.id == id) && (conn.completed == false);
  });
  return matches;
}

var server = net.createServer(function(socket) {	
	//socket = new JsonSocket(socket);
	socket.on('data', function(data) {
		clean(); //Remove finished sockets
		//Parse request data better
				
		var request = parser.parseRequest(data.toString());
		if(request.method == "GET" && request.uri.startsWith("/api/request")){
			var query = request.uri.split("?")[1];
			var params = querystring.parse(query);
			var id = params.connId;
			var timeout = params.timeout;
			var matches = findSocket(id);
		    if(matches.length === 0)
		  	 {
		  	  	arr.push(new conObj(id,socket,timeout));
		  	 }
		  	else
		  	{
		  		socket.end(JSON.stringify({status: "Connection with id: "+id+ " already exists"}));
		  	}
		}
		else if(request.method == "PUT" && request.uri == "/api/kill"){
			var body = JSON.parse(request.body);
			var id = body.connId;
			var matches = findSocket(id);
			if(matches.length === 0)
				{
					socket.end(JSON.stringify({status: "Invalid connection Id: "+id})); //Request doesn't exist
				}
			else{
				//Destroy time out send response
				var conn = matches[0]; //Assuming unique connection ids
				clearTimeout(conn.timer);
				conn.completed = true;
				conn.socket.end(JSON.stringify({status:"killed"}));
				socket.end(JSON.stringify({status:"ok"}));
			}
		}
		else if(request.method == "GET" && request.uri == "/api/status"){
			var endTime = new Date().getTime();
			var result = arr.map(function(conn){
				var rObj = {};
				rObj[conn.id] = (conn.start + conn.duration - endTime)/1000;
				return rObj;
			});
			socket.end(JSON.stringify(result));
		}
		else{
			socket.end("Invalid request");
		}
		
	});
	socket.on('error', function (err) { console.log('err ' + err)});
});

server.listen(3000, '127.0.0.1');