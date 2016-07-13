var mongoose = require('mongoose');

var stockSchema = mongoose.Schema({
	symbol: String
});

module.exports = mongoose.model('Stock', stockSchema);