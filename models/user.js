//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Database model/schema code for Users (with passport-local module) and Notifications
  //
  //  Notes:
  //
  //  Todo:
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var mongoose 				= require('mongoose');
var Schema 					= mongoose.Schema;
var passportLocalMongoose 	= require('passport-local-mongoose');

var Notification = new Schema({
	// companyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Company'},
	// type: {type: String, enum: [
	// 		'Job-New',
	// 		'Job-Edit',
	// 		'User-New',
	// 		'User-Edit',
	// 		'Company-New',
	// 		'Company-Edit',
	// 		'Request-New'], 
	// 		required: true},
	body: {type: String, default: ''}
}, {timestamps:true});


var User = new Schema({
	
	//When using passportlocalmongoose, username and password and added internally
	//username: String	//We will "advertise" this as their email field.
	//password: String

	//When registering, the user is asked for their company name
	//This will just be a string that we really only use to link 
	//them to their actual company  (ref) with the 'company' field below
	companyName: {type: String, default:''},

	//Actual reference to users company (INTERNAL FIELD)
	company: {type: mongoose.Schema.Types.ObjectId, ref: 'Company'},
	
	//Is this user an admin? 
	admin: {type: Boolean, default: false},
	firstname: { type: String, default: ''},
	lastname: { type: String, default: ''},
	//Array of all the notifications for this user
	notifications: [Notification]

	//Time stamp handles both these!
	//registered: {type: Date, required: true},
	//lastSeen: {type: Date, required: true},
	
}, {timestamps: true});

User.methods.getName = function() { return (this.firstname + ' ' + this.lastname); };


User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);