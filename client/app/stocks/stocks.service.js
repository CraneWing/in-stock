angular.module('stockApp')
	.factory('StockFactory', ['$http', function($http) {
		var stockFactory = {};
		var data = {};

		// stocks that load on very first page load
		stockFactory.getInitialStocks = function(dates){
			return $http.post('/api/stocks', dates)
				.success(function(results) {
					// console.log(results);
					data = results;
					
					return data;
				})
				.error(function(err) {
					if (err) console.log(err);
				});
		};

		stockFactory.addStock = function(items) {
			return $http.post('/api/stocks/add', items)
				.success(function(results) {
					// console.log(results);
					data = results;
					
					return data;
				})
				.error(function(err) {
					if (err) console.log(err);
				});
		};

		stockFactory.deleteStock = function(items) {
			return $http.post('/api/stocks/delete', items)
				.success(function(results) {
					data = results;
					return data;
				});
		};

		return stockFactory;

	}]);