var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var logger = require('morgan');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://cranewing-in-stock-3512066:27017/instock');

// stock API route
var stocks = require('./server/routes/stocks');

var port = process.env.PORT || 3000;
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/client'));

io.on('connection', function(socket) {
	console.log('A connection was made!');
	
	socket.on('addStock', function(data) {
		console.log(data);
		console.log('socket.io - stock was added!');
		io.emit('addStock', data);
	});

	socket.on('deleteStock', function(data) {
		console.log(data);
		console.log('socket.io - stock was deleted!');
		io.emit('deleteStock', data);
	});
});

app.use('/api/stocks', stocks);

// error handler route with stack trace for debugging 
app.use(function(error, req, res, next) {
	console.error(error.stack);
	res.send(500, { message: error.message });
});

http.listen(port, function() {
  console.log('Wingardium leviosa! Magic at port ' + port);
});
