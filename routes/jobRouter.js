var express 	= require('express');
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
var Jobs 		= require('../models/jobs');
var Verify		= require("./verify");
var jobRouter 	= express.Router();
jobRouter.use(bodyParser.json());





//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/									jobRouter.route('/')										//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() jobs
//	-Restrictions: Must be logged in
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET" || req.method == "POST" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all jobs
//	-Restrictions: Must be logged in. Admin gets all jobs. Users get only their company jobs.
//	-Request n/a
//	-Repsonse of JSON format for all jobs available
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Jobs.find(req.query)
		.populate('comments.author')
		.populate('company')
		.populate('submitBy')
		.exec(function (err, job) {
			if(err) { return next(new Error("ERROR IN FIND - GET/JOBS: ")); }
			res.json(job);// res.json also sends response code # and headers :O
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.post() new job
//	-Restrictions: Must be logged in
//  -Request JSON format of new Job to be added to the database
// 	-Response confirming the job was successfully created, and printing the ID#
// 	-Possible failures:
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.post(Verify.verifyOrdinaryUser, function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO CREATE THE JOB WITH"));

	Jobs.create(req.body, function(err, job) {
		if(err) { console.log("ERROR IN CREATE - POST/JOBS: ",  err); return next(err); }
		//console.log("New job created: " + job.name + "\nJOB#: " + job._id);
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end("Added a new job with ID# " + job._id);
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.delete() all jobs
//	-Restrictions: Available only to admin!
//  -Request n/a
// 	-Response confirming the number of jobs that were removed from the database.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next) {
	Jobs.remove({}, function(err, resp){
		if(err) { console.log("ERROR IN REMOVE - DELETE/JOBS: ",  err); return next(err); }
		//console.log("Deleted all jobs.");
		res.json(resp);
	});
});





//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/							jobRouter.route('/unclaimed/')										//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() unclaimed jobs
//	-Restrictions: Must be logged in as Admin
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET"))
		return next(new Error("HTTP method " + req.method + " is not supported on /jobs/unclaimed" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all jobs that are not linked to a company
//	-Restrictions: Must be logged in as Admin
//	-Request n/a
//	-Repsonse of JSON format for all jobs available
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Jobs.find({company: {$exists: false}})
		.populate('submitBy')
		.exec(function (err, job) {
			if(err) { return next(new Error("ERROR IN FIND - GET/JOBS/UNCLAIMED: ")); }
			res.json(job);// res.json also sends response code # and headers :O
	});
})





//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/									jobRouter.route('/:jobId')									//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() specific job
//	-Restrictions: Must be logged in
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/put/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET" || req.method == "PUT" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() specific existing job by ID#
//	-Restrictions: Must be logged in
//	-Request 'jobId' via url params
//	-Response of JSON format for specified job
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Jobs.findById(req.params.jobId)
		.populate("comments.author")
		.exec(function(err, job){
			if(err)
			{
				console.log("ERROR IN FIND - GET/JOBID: ",  err);
				//Is this the only error that findById will throw? Not finding the entry??
				return next(new Error("No job in database with ID# " + req.params.jobId));
			}
			res.json(job);
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.put() updated specific existing job by ID#
//	-Restrictions: Available only to admin!
//  -Request 'jobId' via url params and JSON format in body for job properties to update
// 	-Response confirming the job was successfully updated
// 	-Possible failures:
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.put(/*Verify.verifyOrdinaryUser, */function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));

	Jobs.findByIdAndUpdate(req.params.jobId, { $set: req.body } , { new: true }, function(err,job) {
		if(err) { console.log("ERROR IN FIND&UPDATE - PUT/JOBID: ",  err); return next(err); }
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));
		console.log("Updated job # " + job._id + " with the following data: " + JSON.stringify(req.body));
		res.json(job);
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.delete() specific existing job by ID#
//	-Restrictions: Available only to admin!
//  -Request 'jobId' via url params
// 	-Response confirming the job was removed from the database.
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next) {
	Jobs.remove({"_id" : req.params.jobId}, function(err, resp){
		if(err) { console.log("ERROR IN REMOVE - DELETE/JOBID: ",  err); return next(err); }
		//console.log("Deleted job with id#: " + req.params.jobId);
		//I imagine at some point we'll want to render a full on specific "deletion success" page
		res.end("The job with ID# " + req.params.jobId + " has been successfully removed from the database.");
	});
});





//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/								jobRouter.route('/:jobId/comments')								//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() job comments
//	-Restrictions: Must be logged in
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET" || req.method == "POST" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all comments for specific existing job by ID#
//	-Restrictions: Must be logged in
//	-Request 'jobId' via url params
//	-Response of all JSON formatted comment data for specified job
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//	---Job has no comments
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Jobs.findById(req.params.jobId)
		.populate("comments.author")
		.exec(function(err, job){
			if(err || !job) { console.log("ERROR IN FINDING - GET/JOBID/COMMENTS: ",  err); return next(err); }
			if(job.comments.length <= 0) { return next(new Error("There are no comments in this job")); }
			else res.json(job.comments);
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.post() adding a new comment for a specific existing job by ID#
//	-Restrictions: Must be logged in
//  -Request 'jobId' via url params and JSON format in body for new comment to add
// 	-Response of entire JSON formatted job (includes comments)
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.post(Verify.verifyOrdinaryUser, function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO CREATE THE COMMENT WITH"));

	Jobs.findById(req.params.jobId, function(err,job) {
		if(err || !job) { console.log("ERROR IN FINDING - POST/JOBID/COMMENTS: ",  err); return next(err); }
		//Keep track of the user that made the comment
		//req.body.author = req.decoded._doc._id; //OLD VERSION
		req.body.author = req.decoded._id; //apparently this is a slimmer better way

		job.comments.push(req.body);
		job.save(function(err, job){
			if(err) { console.log("ERROR IN SAVING - POST/JOBID/COMMENTS: ",  err); return next(err); }
			//console.log("Added job # %s comments with data %s", job._id, req.body);
			res.json(job);
		});
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.delete() all comments for existing job by ID#
//	-Restrictions: Available only to admin!
//  -Request 'jobId' via url params
// 	-Response confirming all the comments were successfully deleted
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//	---Job has no comments
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next) {
	Jobs.findById(req.params.jobId, function(err, job){
		if(err) { console.log("ERROR IN FINDING - DELETE/JOBID/COMMENTS: ",  err); return next(err); }

		if(!job.comments.length > 0)
			{ res.end("There are no comments to delete!"); return; }

		for(var i = (job.comments.length -1); i >= 0; i--)
			{ job.comments.id(job.comments[i]._id).remove(); }

		job.save(function(err, resp){
			if(err) { console.log("ERROR IN SAVING - DELETE/JOBID/COMMENTS: ",  err); return next(err); }
			//console.log("Deleted all comments for job id#: " + req.params.jobId);
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end("Deleted all comments.");
		});
	});
});





//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/						jobRouter.route('/:jobId/comments/:commentId')							//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() specific comment for existing job
//	-Restrictions: Must be logged in
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET" || req.method == "PUT" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() specific comment for existing job by ID#
//	-Restrictions: Must be logged in
//	-Request 'jobId' and 'commentId' via url params
//	-Response of JSON formatted comment data for specified comment
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID# for job OR comment
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Jobs.findById(req.params.jobId)
		.populate("comments.author")
		.exec(function(err, job){
			if(err)
			{
			 	console.log("ERROR IN FINDING - GET/JOBID/COMMENTS/COMMENTID: ",  err);
			 	//Is this the only error that findById will throw? Not finding the entry??
				return next(new Error("No job in database with ID# " + req.params.jobId));
			}
			else
			{
				var comment = job.comments.id(req.params.commentId);
				if(!comment) return next(new Error(
							"No comment in database for job ID# " + req.params.jobId +
							" with comment ID# " + req.params.commentId));
				else
					res.json(comment);
			}
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.put() updates specific comment for existing job by ID#
//	-Restrictions: Available only to admin!
//  -Request 'jobId' & 'commentId' via url params & JSON format in body for comment to update
// 	-Response of entire job JSON and comments
// 	-Possible failures:
//	---Incorrect/invalid/non-existant ID# for job OR comment
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next) {
	//This operation will delete the entire comment, and upload and entirely new one
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE COMMENT WITH"));

	Jobs.findById(req.params.jobId, function(err, job){
		if(err)
		{
		 	console.log("ERROR IN FINDING - GET/JOBID/COMMENTS/COMMENTID: ",  err);
		 	//Is this the only error that findById will throw? Not finding the entry??
			return next(new Error("No job in database with ID# " + req.params.jobId));
		}
		else
		{
			var comment = job.comments.id(req.params.commentId);
			if(!comment) return next(new Error(
						"No comment in database for job ID# " + req.params.jobId +
						" with comment ID# " + req.params.commentId));
			else
			{
				job.comments.id(req.params.commentId).remove();
				job.comments.push(req.body);
				job.save(function(err, job){
					if(err) { console.log("ERROR IN SAVING - PUT/JOBID/COMMENTS/COMMENTID: ",  err); return next(err); }
					//console.log("Updated job # %s with the following data %s", job._id, json.stringify(req.body));
					res.json(job);
				});
			}
		}
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.delete() specific comment from existing job by ID#
//	-Restrictions: Available to admin or author of comment
//  -Request 'jobId' & 'commentId' via url params
// 	-Response confirming the job was removed from the database.
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.delete(Verify.verifyOrdinaryUser, function(req, res, next) {
	Jobs.findById(req.params.jobId, function(err, job){
		if(err) { console.log("ERROR IN FINDING - DELETE/JOBID/COMMENTS/COMMENTID: ",  err); return next(err); }
		if(job.comments.id(req.params.commentId).author != req.decoded._id)
		{
			var err = new Error("You are not authorized to delete this comment");
			err.status = 403;
			return next(err);
		}
		job.comments.id(req.params.commentId).remove();
		job.save(function (err, resp){
			//if(err) throw err;
			if(err) { console.log("ERROR IN SAVING - DELETE/JOBID/COMMENTS/COMMENTID: ",  err); return next(err); }
			console.log("Deleted comment [ID# %s] for job [ID# %s]", req.params.commentId, req.params.jobId);
			res.json(resp);
		});
	});
});





module.exports = jobRouter;
