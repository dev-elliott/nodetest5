//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Database model/schema code for comments/inquiries/requests from visitors or registered users
  //
  //  Notes:
  //
  //  Todo:
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;


var Request = new Schema({
	//If the user is registered and logged in
	userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	//Their inquiry message
	comment: {type: String, required: true},
	//If the visitor is logged in: autopopulate, otherwise prompt for their company name
	company: {type: String},
	//First and last name in one string
	name: {type: String, required: true},
	//Contact information, if not logged in
	email: {type: String, required: true}

}, {timestamps: true});

var Requests = mongoose.model('Request', Request);
module.exports = Requests;