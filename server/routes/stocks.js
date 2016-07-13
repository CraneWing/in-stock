var express = require('express');
var router = express.Router();
//var Quandl = require('quandl');
var http = require('http');
var async = require('async');
var request = require('request');
var _ = require('lodash');
var Stock = require('../models/stock');
var key = require('../config/key');

// fetch stocks that always load on initial page load
router.post('/', function(req, res) {
	// dates are actually backwards here, because Quandl sorts
	// from the present going backward. 
	var startDate = req.body.start_date;
	var endDate = req.body.end_date;
	var stockData = [];

	Stock.find(function(err, stocks) {
		if (err) res.send(err);
		console.log(stocks.length);
		// loop through symbols array and pass to async
		// function that will make API call and process
		// raw data for the line chart.
		if (stocks.length === 0) {
			res.json({
				message: 'Currently no stocks.'	
			});
		}
		else {
			_.each(stocks, function(stock) {
			
				getStockData(stock.symbol, startDate, endDate, function(err, data) {
					// callback returned individual stock item. add
					// it to main stock array.
					stockData.push(data);
		
					console.log('stockData length is ' + stockData.length);
					// when stockData array is same length as 
					// symbols array, then all asynchronous 
					// activities have concluded.
					if (stocks.length === stockData.length) {
						res.json({
							start_date: startDate,
							end_date: endDate,
							stock_data: stockData
						});
					} 
				}); // getStockData
			}); // _.each
		}
	}); // Stock.find
}); // router.post '/'

// add a stock
router.post('/add', function(req, res) {
	var startDate = req.body.dates.start_date;
	var endDate = req.body.dates.end_date;
	var symbol = req.body.symbol.toUpperCase();
	console.log('symbol is ' + symbol);
	
	var stockData = [], msg = null;

	getStockData(symbol, startDate, endDate, function(err, data) {
		console.log('data response is ' + data);

		if (data !== 'Stock not found!') {
			var newStock = new Stock({
				symbol: symbol
			});

			newStock.save(function(err) {
				if (err) res.send(err);
				console.log('New stock ' + symbol + ' has been saved');
			});

			stockData.push(data);
		}
		else {
			msg = 'Sorry, stock "' + symbol + '" does not exist. Please try again.';
		}
	});

	// then get all the stocks again to re-render
	// the line chart
	Stock.find(function(err, stocks) {
		if (err) res.send(err);
		var count = 0;

		_.each(stocks, function(stock) {
			getStockData(stock.symbol, startDate, endDate, function(err, data) {
				stockData.push(data);
				count++;

				if (stocks.length === count) {
					res.json({
						start_date: startDate,
						end_date: endDate,
						stock_data: stockData,
						message: msg
					});
				} 
			}); // getStockData
		}); // _.each
	}); // inner Stock.find
}); // router.post('/add')

router.post('/delete', function(req, res) {
	console.log('in backend delete');
	
	var startDate = req.body.dates.start_date;
	var endDate = req.body.dates.end_date;
	var symbol = req.body.symbol;
	//console.log( 'symbol is ' + symbol);
	//console.log('start date is ' + startDate + ' and end date is ' + endDate);

	var stockData = [];
	// delete the stock by its exchange symbol
	Stock.remove({ symbol: symbol }, function(err) {
		if (err) res.send(err);

		console.log('stock ' + symbol + ' was deleted!');

		// get the other stocks to re-render line chart
		Stock.find(function(err, stocks) {
			console.log('in the find all stocks in delete block');
			if (err) res.send(err);

			if (stocks.length === 0) {
				res.json({
					message: 'All stocks were deleted!'
				});
			}
			else {
				_.each(stocks, function(stock) {
					getStockData(stock.symbol, startDate, endDate, function(err, data) {
						stockData.push(data);

						if (stocks.length == stockData.length) {
							console.log('sending back updated stocks after ' + symbol + ' was deleted');

							res.json({
								start_date: startDate,
								end_date: endDate,
								stock_data: stockData
							});
						} 
					}); // getStockData
				}); // _.each
			}
		}); // Stock.find
	}); // Stock.remove
}); // router.delete

// makes API call and gets and processes data
function getStockData(symbol, startDate, endDate, cb) {
	//console.log('in getStockData');

	async.waterfall([
		function(callback) {
		  // console.log('in waterfall function 1');
			var data = {};
			// API base URL for Quandl
			var url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + symbol + '.json';
			// Quandl API params
			var params = {
				api_key: key.apiKey,
				start_date: startDate,
				end_date: endDate,
				exclude_column_names: true,
				column_index: 4
			};
			// use request module to make API query
			request.get({url: url, qs: params}, function(err, response, body) {
				if (!err && response.statusCode == 200) {
					// console.log(body);
					callback(null, body);
				}
				else if (response.statusCode == 404) {
					console.log('the error is ' + err);
					callback(null, body);
				}
			});	
		},
		function(data, callback) {
			var item = JSON.parse(data);

			// if no stock found, return
			if (item.quandl_error) {
				var msg = 'Stock not found!';
				callback(null, msg);
			}
			else { // valid stock symbol!
				// console.log('in waterfall function 2');
				var stock = {}, company, cut;
				// take company name alone out of longer string
				company = item.dataset.name;
				cut = company.indexOf('(');
				company = company.slice(0, cut).trim();
				// assign company name, symbol and prices 
				// to stock object
				stock.company = company;
				stock.symbol = symbol;
				stock.prices = item.dataset.data;
				// send back to main function
				callback(null, stock);
			}
		}
	], cb);
}

module.exports = router;