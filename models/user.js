var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
	
	//When using passportlocalmongoose, username and password and added internally
	//username: String,
	//password: String,

	//Company name provided by user. 
	company: {type: String, required: true},
	//Admin generated, correct company ID
	companyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Company'},
	email: {type: String, required: false},
	admin: {type: Boolean, default: false},
	firstname: { type: String, default: ''},
	lastname: { type: String, default: ''}


	//Time stamp handles both these!
	//registered: {type: Date, required: true},
	//lastSeen: {type: Date, required: true},
	
}, {timestamps: true});

User.methods.getName = function() { return (this.firstname + ' ' + this.lastname); };


User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);