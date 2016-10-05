var express = require('express');
var _ = require('lodash'); //Just cherry pick array methods
var router = express.Router();

var arr = [];

var conObj = function(id,res,timeout){
	this.id = id;
	this.res = res;
	this.completed = false;
	this.start = new Date().getTime();
	this.duration = timeout*1000;
	this.sendResponse = function(){
		this.completed = true;
    	this.res.json({status: "ok"});
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
/* GET home page. */
router.get('/request?*', function(req, res) {
  var id = req.query.connId;
  var timeout = req.query.timeout;
  //Remove connections that are already completed
  clean();
  var matches = findSocket(id);
  if(matches.length === 0)
  	arr.push(new conObj(id,res,timeout));
  else
  	res.json({status: "Connection with id: "+id+ " already exists"});
});


router.get('/status', function(req,res){
	var endTime = new Date().getTime();
	//Remove connections that are already completed
	clean();
	var result = arr.map(function(conn){
		var rObj = {};
		rObj[conn.id] = (conn.start + conn.duration - endTime)/1000;
		return rObj;
	});
	res.json({result}); 
});

router.put('/kill', function(req,res){
	var id = req.body.connId;
	clean();
	//kill request if it hasn't completed and exists
	var matches = findSocket(id);
	if(matches.length === 0)
		res.json({status: "Invalid connection Id: "+id}); //Request doesn't exist
	else{
		//Destroy time out send response
		var conn = matches[0]; //Assuming unique connection ids
		clearTimeout(conn.timer);
		conn.completed = true;
		conn.res.json({status:"killed"});
		res.json({status:"ok"});
	}
});

module.exports = router;
