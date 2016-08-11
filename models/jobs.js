//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Database model/schema code for Jobs with their respective specs and comments
  //
  //  Notes:
  //
  //  Todo:
  //	-Complete the specSchema with actual APEX Job spec requirements
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

//Be sure these are declared prior to the jobSchema that uses them!
var commentSchema = new Schema({
	//Author who wrote the comment (either the Plumber or Admin)
	author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	body: {type: String, required: true}
}, {timestamps: true});

var specSchema = new Schema({
	psi: {type: Number, required: true },
	run: Number
}, {timestamps: true});



var Job = new Schema({
	// ***** NEW JOB SUBMISSION FIELDS
	//Job name provided by plumber. Generally arbitrary. Not unique? Required at time of submission.
	name: {type: String, required: true	},
	//Lot number, not always provided. Not unique, not required.
	lot: {type: String },
	//Floor plan number, not always provided. Not unique, not required.
	floorPlan: {type: String},
	//Job Number, generated by APEX, not required upon submission.
	jobNumber: {type: String, default:'Pending'},

	// ***** INTERNAL DATA FIELDS
	//Plumber company name, auto generated based upon who is logged in
	company: {type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true},
	//Status: Pending=Awaiting APEX confirmation (job is NEW); Postponed=AWaiting info from customer
	status: {type: String, enum: ['Pending', 'Cancelled', 'Complete', 'Postponed', 'In-progress' ], default: 'Pending', required: true},
	//Download link: URL to download plans
	download: [{type: String}],
	//SubmitBy: _id of USER who submit the job
	submitBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

	//Conversation comments !! This is an array (of comment objects) because we can have multiple 
	comments: [commentSchema],
	//Job data specification. This is a SINGLE OBJECT with multiple fields
	specs: specSchema
	
}, {timestamps: true});




Job.methods.dump = function()
{
	console.log("Here is all our job information..." +
		"\nPLUMBER: " + this.plumber, 
		"\nNAME: " + this.name,
		"\nSUBMITBY: " + this.submitBy,  
		"\nLOT#: " + this.lot, 
		"\nFLOORPLAN: " + this.floorPlan, 
		"\nJOB#: " + this.jobNumber, 
		"\nSTATUS: " + this.status, 
		"\nDOWNLOAD: " + this.download
		);

	console.log("---> Job comments...");
	for(var index in this.comments)
	{
		console.log("------> AUTHOR: ", this.comments[index].author);
		console.log("------> BODY: ", this.comments[index].body);
	}

	console.log("---> Job specifications...");
	if(this.specs)
		console.log("------> PSI: ", this.specs.psi);
};


//The first argumenet is the SINGULAR name of your collection that the model belongs to.
//Mongoose automatically looks for the PLURAR version.

// exports.Jobs = mongoose.model('job', jobSchema); //Database apex/job
// exports.Comments = mongoose.model('comment', commentSchema); //Database apex/comment
// exports.Specs = mongoose.model('spec', specSchema); //Database apex/spec

var Jobs = mongoose.model('Job', Job);
module.exports = Jobs;