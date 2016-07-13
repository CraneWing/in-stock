angular.module('stockApp')
	.controller('StockChartCtrl', ['$scope', '$http', 'StockFactory', 'socket',
		function($scope, $http, StockFactory, socket) {
			socket.on('addStock', function(data) {
				console.log('add data in client side');
				// console.log(data);
				// function to make stock chart
				createLineChart(data.stocks, data.days);
				$scope.loading = false;
			});

			socket.on('deleteStock', function(data) {
				console.log('delete data in client side');
				//console.log(data);
				createLineChart(data.stocks, data.days);
				$scope.loading = false;
			});

			// disconnect when they leave
			$scope.$on('$locationChangeStart', function(event) {
				socket.disconnect(true);
			});
			
			// makes date calculations from yesterday to 1 Jan.
			// to fetch year-to-date closing price data.
			$scope.getYTDStocks = function() {
				// get yesterday's date
				var day2 = moment().subtract(1, 'days');
				// get this year
				var thisYear = parseInt(moment(day2, 'MM-DD-YYYY').year());
				// get 1 January of this year
				var day1 = moment([thisYear, 0, 1]);
				// get number of days between 1 January and yesterday
				var numDays = day2.diff(day1, 'days');

				$scope.getAllStocks(numDays);
			};
	
			// gets all stocks on chart. flexible starting date
			// so it can be reused for different time spans.
			$scope.getStocks = function(days) {
				$scope.loading = true;
				// get yesterday's date and format for Quandl API
				$scope.endDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
				// get date based on value passed, from 1 month to 1 year
				$scope.startDate = moment().subtract(days, 'days').format('YYYY-MM-DD');
				// console.log($scope.startDate, $scope.endDate);

				StockFactory.getInitialStocks({
					start_date: $scope.startDate, 
					end_date: $scope.endDate
				})
				.success(function(results) {
					$scope.loading = false;

					if (results.message) {
						$scope.message = results.message;
					}
					else {
						$scope.message = '';

						$scope.stockData = results;

						$scope.areStocks = true;
						// function to make stock chart
						createLineChart($scope.stockData, days);
					}
				});
			};

			$scope.addStock = function() {
				$scope.loading = true;
				// send new stock to backend with date range
				StockFactory.addStock({
					dates: {
						start_date: $scope.startDate,
						end_date: $scope.endDate
					},
					symbol: $scope.symbol
				})
				.success(function(results) {
					$scope.loading = false;
					$scope.message = '';
					$scope.symbol = '';

					if (results.message !== null) {
						$scope.message = results.message;
					}

					$scope.stockData = results;

					socket.emit('addStock', {
						stocks: $scope.stockData,
						days: $scope.days
					});
			 });
			};

			$scope.deleteStock = function(symbol) {
				$scope.loading = true;

				StockFactory.deleteStock({
					dates: {
						start_date: $scope.startDate,
						end_date: $scope.endDate
					},
					symbol: symbol
				})
				.success(function(results) {
					if (results.message) {
						$scope.message = 'Currently no stocks.';
					}
					else {
						$scope.message = '';
						$scope.stockData = results;

						socket.emit('deleteStock', { 
							stocks: $scope.stockData,
							days: $scope.days
						});
					}
				});
			};

			function createLineChart(data, days) {
				// arrays for various options required
				//  for angular-chart.js
				// price data to build y-axis
				var prices = [];
				// dates to build x-axis
				var dateLabels = [];
				// series is array of items that will be plotted on
				// chart; in this case, each company's stock.
				var series = [];
				// rectangles below the chart - this is my own 
				// markup, not angular-chart.js. same for the symbols:
				// they will be listed in the form element for app use.
				var cards = [];
				var symbols = [];
				var timeUnit = days < 61 ? 'day' : 'month';
				// this determines whether day or month labels used on
				// chart's x-axis.
				
				// custom colors -- these are the same colors used in 
				// Flat UI interface.
				$scope.colors = ['#2980b9', '#c0392b', '#1abc9c', '#27ae60', '#8e44ad',
  			'#f1c40f', '#e67e22'];

				// create range of date labels for x-axis using dates from 
				// data of first company in stock_data array.
				for (var i = 0; i < data.stock_data[0].prices.length; i++) {
					dateLabels.push(data.stock_data[0].prices[i][0]);
				}
 
				// loop through each company's stock data to get
				// company name and price data to plot.
				data.stock_data.forEach(function(stock, index) {
					var p = [];
					// company name and stock exchange symbol will
					// be on each "card".
					cards.push({
						symbol: stock.symbol,
						company: stock.company,
						color: $scope.colors[index]
					});
					// company names added to series
					series.push(stock.company);
					// symbols array for the add form element
					symbols.push(stock.symbol);

					for (var i = 0; i < stock.prices.length; i++) {
						p.push(stock.prices[i][1]);
					}
					// set prices array to empty again for next company
					prices.push(p);
					p = [];
				});

				// gloabal Chart.js options, as formatted to
				// work with angular-chart.js.
				$scope.options = {
					responsive: true,
					animationSteps: 30,
					animationEasing: 'easeOutQuart',
					bezierCurve: false,
					defaultFontFamily: 'Lato',
					time: {
						tooltipFormat: 'D MMM YYYY'
					},
					elements: {
						line: {
							fill: false
						}
					},
					scales: {
            xAxes: [{
            	type: 'time',
            	time: {
            		unit: timeUnit,
            		displayFormats: {
            			'day': 'D MMM YYYY',
            		 	'month': 'MMM YYYY'
            	  }
            	},
            	gridLines: {
            		display: false
            	},
            	ticks: {
            		autoSkip: true
            	}
            }]
	        },
				};

				$scope.days = days;
				$scope.dates = [dateLabels[0], dateLabels[dateLabels.length - 1]];
				$scope.symbols = symbols;
				$scope.cards = cards;
				$scope.labels = dateLabels;
				$scope.series = series;
				$scope.data = prices; 
			} // createLineChart

			// inital page load and stock display (1 week of stocks)
			$scope.getStocks(7);
	}]);