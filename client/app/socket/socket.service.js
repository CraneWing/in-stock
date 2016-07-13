angular.module('stockApp')
	.factory('socket', ['socketFactory', function(socketFactory) {
		return socketFactory();
}]);