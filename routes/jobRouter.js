//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  // Server-side HTTP routing.
  // Handling get/post/put/delete data for jobs and their comments
  //
  //  Notes:
  //
  //  Todo:
  //	-notifier actions need more detail/formatting and to be included on every action 
  //	 such as a new job, edited job, new comment (from admin or from user, + who to notify)
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var express 	= require('express');
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
var Jobs 		= require('../models/jobs');
var Companies	= require('../models/companies');
var Utility		= require("./utility");
var jobRouter 	= express.Router();
jobRouter.use(bodyParser.json());



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/jobRouter.route('/')																			//╣ notify
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() jobs
	//	-Restrictions: Must be logged in
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
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
		if(req.decoded.admin)
		{
			//Retrieve all jobs in database for admin
			Jobs.find(req.query)
				//.populate('comments.author')
				.populate('company')
				.populate('submitBy')
				.exec(function (err, jobs) {
					if(err) { return next(new Error("ERROR IN FIND - GET/JOBS: ")); }
					res.json(jobs);
					return;
			});
		}
		else
		{
			//Not admin, return jobs for your company only. 
			//First make sure the user has been assigned a company though!
			//Also......since we query this...we have to return an array!
			if(!req.decoded.company)
			{
				console.log("we detected a brand new uninitiated user");
				var data = [{}];
				data[0] = {result:"Failed", message:"User not yet linked to company. Contact admin."};
				data[1] = {test:"fillerDataHere"};
				res.json(data); 
				return;
			}
			var companyId = mongoose.Types.ObjectId(req.decoded.company.toString());
			Jobs.find({company: companyId})
				.populate('company')
				.populate('submitBy')
				.exec(function (err, jobs) {
					if(err) { return next(new Error("ERROR IN FIND - GET/JOBS: ")); }
					if(!jobs || jobs.length < 1) 
					{
						var data = [{}];
						data[0] = {result:"Success", count:0};
						res.json(data);
						return;
					}
					res.json(jobs);
					return;
			});
		}
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.post() new job, either as an admin [option to add a new copmany] or user
	//	-Restrictions: Must be logged in
	//  -Request JSON format of new Job to be added to the database
	// 	-Response: ID# for the new job
	// 	-Possible failures:
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.post(function(req, res, next) {
		console.log("so ur tryna submit a new job...data below");
		console.log(req.body);

		//Manually submitting a new job as an Admin:

		if(req.decoded.admin)
		{
			//req.body[0] JSON data for a new company 
			//req.body[1] JSON data for a new job

			var job = Jobs(req.body[1]);
			var oid = mongoose.Types.ObjectId(req.decoded._id.toString());
			job.submitBy = oid;

			if(req.body[0].company)//Existing company selected
			{
				//Make new job with req.body[1]
				console.log("Trying to save this job:");
				console.log(job);
				job.company = req.body[0].company;
				job.save(function(err){
					if(err) return(next(err));
					res.json({result:job._id});
				});

			}

			//QUICK ADD CURRENTLY DISABLED
			// else //We are making a new company first
			// {
			// 	var company = Companies(req.body[0]);
			// 	//Save our company so we can get it's id
			// 	company.save(function(err, updatedCo){ 
			// 		if(err) return(next(err));
			// 		//Add the company id to the job, then save it
			// 		job.companyId = updatedCo._id;
			// 		job.save(function(err, updatedJob){
			// 			if(err) return(next(err));
			// 			//Finally, save the company again after pushing the job
			// 			updatedCo.jobs.push(updatedJob);
			// 			updatedCo.save(function(err){
			// 				if(err) return(next(err));
			// 			});
			// 		});
			// 	});
			// }
		}


		else //normal logged in user with a companyId in token
		{
			//Check for non-existant JSON body data before trying to validate/create it
			if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO CREATE THE JOB WITH"));

			var job = Jobs(req.body[1]);
			var userId = mongoose.Types.ObjectId(req.decoded._id.toString());
			var companyId = mongoose.Types.ObjectId(req.decoded.company.toString());
			job.submitBy = userId;
			job.company = companyId;

			//load up company data so when we pass it to the notifications, it can spit out company.name
			//job.populate("company");
			//Doesn't work. Lame. Now I have to query....

			//This is garbage. I don't know how else to get this data and send it to notification generation though. 
			var companyObject;
			Companies.findById(companyId).exec(function(err, com){
				companyObject = com;
			});


			job.save(function(err, job) {
				if(err) { console.log("ERROR IN CREATE - POST/JOBS: ",  err); return next(err); }

				//notifyAdmin( type = Job-New , obj1 = company , obj2 = job)
				console.log("Calling notifyadmnin");
				Utility.notifyAdminMessage("a jobby has been madey");
				Utility.notifyAdmin("Job-New", companyObject, job);
				res.json({result:job._id});
			});
		}
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.delete() all jobs
	//	-Restrictions: Available only to admin!
	//  -Request n/a
	// 	-Response confirming the number of jobs that were removed from the database.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.delete(Utility.verifyAdmin, function(req, res, next) {
		console.log("To delete all jobs, please access mongod directly..")
		// Jobs.remove({}, function(err, resp){
		// 	if(err) { console.log("ERROR IN REMOVE - DELETE/JOBS: ",  err); return next(err); }
		// 	//console.log("Deleted all jobs.");
		// 	res.json(resp);
		// });
		res.json({result:"Nah"});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/jobRouter.route('/:jobId')																		//╣ notify
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() specific job
	//	-Restrictions: Must be logged in
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/put/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
		if(!(req.method == "GET" || req.method == "PUT" || req.method == "DELETE"))
			return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
		next();
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//  .get() specific existing job by ID#
	//	-Restrictions: Must be logged in. Admin can get any job. User must get their company job
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
				if(req.decoded.company == job.company || req.decoded.admin)
					res.json(job);
				else return next(new Error("You are not authorized to view this job"));
		});
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.put() updated specific existing job by ID#
	//	-Restrictions: Must belong to the owning company or be admin
	//  -Request 'jobId' via url params and JSON format in body for job properties to update
	// 	-Response confirming the job was successfully updated
	// 	-Possible failures:
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//	-NOTIFY:
	//	---
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.put(function(req, res, next) {
		//Check for non-existant JSON body data before trying to validate/create it
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));

		Jobs.findByIdAndUpdate(req.params.jobId, { $set: req.body } , { new: true })
		.populate('company')
		.exec(function(err,job) {
			if(err) { console.log("ERROR IN FIND&UPDATE - PUT/JOBID: ",  err); return next(err); }
			if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));
			if(req.decoded.company == job.company || req.decoded.admin)
			{
				//console.log("Updated job # " + job._id + " with the following data: " + JSON.stringify(req.body));
				//If the update is done by a non-admin, notify the admin of the changes.
				if(!req.decoded.admin) 
				{
					var obj1 = {};
					var obj2 = {};
					obj1.id = job.company._id;
					obj1.name = job.company.name;
					obj2.id = job._id;
					obj2.number = job.jobNumber;
					Utility.notifyAdminNEW("Job-Edit", obj1, obj2);
				}
				res.json(job);
			}
			else 
				return next(new Error("You are not authorized to edit this job"));
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
	.delete(Utility.verifyAdmin, function(req, res, next) {
		Jobs.remove({"_id" : req.params.jobId}, function(err, resp){
			if(err) { console.log("ERROR IN REMOVE - DELETE/JOBID: ",  err); return next(err); }
			//console.log("Deleted job with id#: " + req.params.jobId);
			//I imagine at some point we'll want to render a full on specific "deletion success" page
			res.json({result:"Success"});
		});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/jobRouter.route('/:jobId/comments')															//╣ notify
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() job comments
	//	-Restrictions: Must be logged in as admin or belong to company 
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
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
				if(req.decoded.company == job.company || req.decoded.admin)
				{
					if(job.comments.length <= 0) { return next(new Error("There are no comments in this job")); }
					res.json(job.comments);
				}
				else
				{
					return next(new Error("You are not authorized to view this job's comments"));
				}
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
	.post(function(req, res, next) {
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
				Utility.notifyAdmin("A new comment has been posted for job id#" + req.params.jobId);
				//For notifying all the users involved in this job that the admin has posted a new comment
				//Build an array of userids from:
				//	-Every comment author id
				//	-Job author id
				// make sure no duplicates, use id.equals() for comparisions/checks
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
	.delete(Utility.verifyAdmin, function(req, res, next) {
		Jobs.findById(req.params.jobId, function(err, job){
			if(err) { console.log("ERROR IN FINDING - DELETE/JOBID/COMMENTS: ",  err); return next(err); }

			if(!job.comments.length > 0)
				{ res.json({result:"There are no comments to delete!"}); return; }

			for(var i = (job.comments.length -1); i >= 0; i--)
				{ job.comments.id(job.comments[i]._id).remove(); }

			job.save(function(err, resp){
				if(err) { console.log("ERROR IN SAVING - DELETE/JOBID/COMMENTS: ",  err); return next(err); }

				res.json({result:"Deleted all comments."});
			});
		});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/jobRouter.route('/:jobId/comments/:commentId')													//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() specific comment for existing job
	//	-Restrictions: Must be logged in
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
		if(!(req.method == "GET" || req.method == "DELETE"))
			return next(new Error("HTTP method " + req.method + " is not supported on /jobs" + req.url));
		next();
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//  .get() specific comment for existing job by ID#
	//	-Restrictions: Must be logged in and belong to the jobs company
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
					if(req.decoded.company == job.company || req.decoded.admin)
					{
						var comment = job.comments.id(req.params.commentId);
						if(!comment) return next(new Error(
									"No comment in database for job ID# " + req.params.jobId +
									" with comment ID# " + req.params.commentId));
						else
							res.json(comment);
					}
				}
		});
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//		** NOT ALLOWING USERS TO EDIT COMMENTS, THIS METHOD IS NOT SUPPORTED IN .ALL **
	//	.put() updates specific comment for existing job by ID#
	//	-Restrictions: Available only to admin!
	//  -Request 'jobId' & 'commentId' via url params & JSON format in body for comment to update
	// 	-Response of entire job JSON and comments
	// 	-Possible failures:
	//	---Incorrect/invalid/non-existant ID# for job OR comment
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.put(Utility.verifyAdmin, function(req, res, next) {
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
	//	-Restrictions: Available to admin 
	//  -Request 'jobId' & 'commentId' via url params
	// 	-Response confirming the job was removed from the database.
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.delete(Utility.verifyAdmin, function(req, res, next) {
		Jobs.findById(req.params.jobId, function(err, job){
			if(err) { console.log("ERROR IN FINDING - DELETE/JOBID/COMMENTS/COMMENTID: ",  err); return next(err); }

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
