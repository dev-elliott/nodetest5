var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Company = new Schema({
	//type: {type: String, default: "Company" },
	name: {type: String, required: true},
	address1: {type: String, required: true},
	address2: {type: String},
	city: {type: String, required: true},
	zip: {type: String, required: true},
	state: {type: String, required: true},
	phone: {type: String},
	employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	jobs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Job'}]
}, {timestamps: true});

Company.methods.getInfo = function() 
{ 
	var line2 = "";
	if(address2) line2 = (address2 + "\n");

	return (this.name + '\n' 
			+ this.address1 + '\n' 
			+ line2 
			+ this.city + ', ' + this.state + ' ' + this.zip ); 
};

module.exports = mongoose.model('Company', Company);