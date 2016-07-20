var express 	= require('express');
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
var Jobs 		= require('../models/jobs');
var Companies	= require('../models/companies');
var Users		= require('../models/user');
var Verify		= require("./verify");
var dataRouter 	= express.Router();
dataRouter.use(bodyParser.json());




//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/									dataRouter.route('/users')									//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() 
//	-Restrictions: Must be logged in as Admin
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(/*verify.verifyAdmin,*/ function(req, res, next) {
	if(!(req.method == "GET"))
		return next(new Error("HTTP method " + req.method + " is not supported on details/users/" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all users
//	-Restrictions: Must be logged in as Admin
//	-Request n/a
//	-Repsonse of JSON format for all users
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Users.find({admin:{$in: [null, false]}})
		.populate('companyId')
		.exec(function (err, users) {
			if(err) { return next(new Error("ERROR IN FIND - DATA GET/USERS: ")); }
			res.json(users);// res.json also sends response code # and headers :O
	});
})

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/								dataRouter.route('/users/:userId')								//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() 
//	-Restrictions: Must be logged in to view your account, admin login for any other account
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(/*verify.verifyAdmin,*/ function(req, res, next) {
	if(!(req.method == "GET" || req.method == "PUT" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on details/users/" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.put() update specific existing user by ID#
//	-Restrictions: Available only to admin!
//  -Request 'userId' via url params and JSON format in body for user properties to update
// 	-Response confirming the user was successfully updated
// 	-Possible failures:
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.put(/*Verify.verifyOrdinaryUser, */function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE USER WITH"));

	Users.findByIdAndUpdate(req.params.userId, { $set: req.body } , { new: true }, function(err,user) {
		if(err) { console.log("ERROR IN FIND&UPDATE - PUT DATA/USERS/USERID: ",  err); return next(err); }
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE USER WITH"));
		console.log("Updated user # " + user._id + " with the following data: " + JSON.stringify(req.body));
		res.json({result:'Success'});
	});
})


//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/							dataRouter.route('/users/unclaimed/')								//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() users not linked with a company
//	-Restrictions: Must be logged in as Admin
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(function(req, res, next) {
	if(!(req.method == "GET"))
		return next(new Error("HTTP method " + req.method + " is not supported on /data/users/unclaimed" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all users that are not linked to a company
//	-Restrictions: Must be logged in as Admin
//	-Request n/a
//	-Repsonse of JSON format for all users available (excluding Admin accounts)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Users.find({company: {$exists: false}, admin:{$in: [null, false]}})
		.exec(function (err, user) {
			if(err) { return next(new Error("ERROR IN FIND - GET DATA/USERS/UNCLAIMED: ")); }
			res.json(user);// res.json also sends response code # and headers :O
	});
})



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/									dataRouter.route('/companies')								//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() 
//	-Restrictions: Must be logged in as Admin
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(/*verify.verifyAdmin,*/ function(req, res, next) {
	if(!(req.method == "GET" || req.method == "POST" || req.method == "DELETE"))
		return next(new Error("HTTP method " + req.method + " is not supported on details/companies/" + req.url));
	next();
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all companies
//	-Restrictions: Must be logged in as Admin
//	-Request n/a
//	-Repsonse of JSON format for all companies
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Companies.find(req.query)
		.populate('employees')
		.populate('jobs', '_id') //i also want to send the status, whats the right syntax??
		.exec(function (err, companies) {
			if(err) { return next(new Error("ERROR IN FIND - DATA GET/CONPANIES: ")); }
			res.json(companies);// res.json also sends response code # and headers :O
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.post() new company
//	-Restrictions: Must be logged in as Admin
//  -Request JSON format of new company to be added to the database
// 	-Response confirming the job was successfully created, and printing the ID#
// 	-Possible failures:
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.post(Verify.verifyAdmin, function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO CREATE THE JOB WITH"));

	Companies.create(req.body, function(err, job) {
		if(err) { console.log("ERROR IN CREATE - POST DATA/COMPANIES: ",  err); return next(err); }
		console.log("New company created: " + company.name + "\nCOMPANY#: " + company._id);
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end("Added a new company with ID# " + company._id);
	});
})























//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/							dataRouter.route('/companies/:id')									//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() specific company
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
//  .get() specific existing company by ID#
//	-Restrictions: Must be logged in
//	-Request 'jobId' via url params
//	-Response of JSON format for specified company
// 	-Possible failures:
// 	---Incorrect/invalid/non-existant ID#
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {
	Companies.findById(req.params.jobId)
		.populate("comments.author")
		.exec(function(err, company){
			if(err)
			{
				console.log("ERROR IN FIND - GET DATA/COMPANIES/COMPANYID: ",  err);
				//Is this the only error that findById will throw? Not finding the entry??
				return next(new Error("No company in database with ID# " + req.params.id));
			}
			res.json(company);
	});
})
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.put() update specific existing company by ID# -- add job or employee to their respective array
//	-Restrictions: Available only to admin!
//  -Request company id via url params and JSON format in body for company properties to update
// 	-Response confirming the company was successfully updated
// 	-Possible failures:
// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.put(Verify.verifyAdmin, function(req, res, next) {
	//Check for non-existant JSON body data before trying to validate/create it
	if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE COMPANY WITH"));

	Companies.findByIdAndUpdate(req.params.id, { $set: req.body } , { new: true }, function(err,company) {
		if(err) { console.log("ERROR IN FIND&UPDATE - PUT/JOBID: ",  err); return next(err); }
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));
		console.log("Updated company # " + company._id + " with the following data: " + JSON.stringify(req.body));
		res.json(company);
	});
})


















//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/								dataRouter.route('/companies/:id/jobs/')					//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//	.all() 
//	-Restrictions: Must be logged in as Admin
//	-Handle any immediated errors with our request:
//	-Method not supported (anything but get/post/delete)
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.all(/*verify.verifyAdmin,*/ function(req, res, next) {
	if(!(req.method == "POST"))
		return next(new Error("HTTP method " + req.method + " is not supported on details/companies/:id/jobs/" + req.url));
	next();
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

	Companies.findById(req.params.id, function(err,company) {
		if(err || !company) { console.log("ERROR IN FINDING - POST DETAILS/COMPANY/ID: ",  err); return next(err); }


		company.jobs.push(req.body);
		company.save(function(err, company){
			if(err) { console.log("ERROR IN SAVING - POST/JOBID/COMMENTS: ",  err); return next(err); }
			console.log("Associated jobID# " + req.body._id + " for company " + company.name);
			res.json({result:'Success'});
		});
	});
})













//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/							dataRouter.route('/details/:id')									//╣
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
//  .get() all data for whatever object is associated with the given ID
//	-Restrictions: Must be logged in as normal user, and be associated with request
//	-Request n/a
//	-Repsonse of JSON format for all jobs available
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
.get(function(req, res, next) {

	Jobs.findById(req.params.id)
	.populate('comments.author')
	.populate('company')
	.populate('submitBy')
	.exec(function (err, job) 
	{
		if(job) 
		{ 
			var data = [{}];
			data[0] = {type:"Job"};
			data[1] = job;
			res.json(data); 
			return;
		}
		else 
		{
			Users.findById(req.params.id)
			.populate('companyId')
			.exec(function (err, user) 
			{
				if(user) 
				{ 
					var data = [{}];
					data[0] = {type:"User"};
					data[1] = user;
					res.json(data); 
					return;
				}
				else
				{
					Companies.findById(req.params.id)
					.populate('employees')
					.exec(function(err, company)
					{
						if(company) 
						{ 
							var data = [{}];
							data[0] = {type:"Company"};
							data[1] = company;
							res.json(data); 
							return;
						}
						else 
						{ 
							var data = [{}];
							data[0] = {type:"Failed"};
							data[1] = {type:"Failed"}; 
							//data[1] is filler JSON just so we can return an array, since we "query" this function
							//our client expects an array whether we succeed (find) or don't (no results)
							res.json(data); 
							return; 
						}
					});
				}
			});
		}
	});
});
		

module.exports = dataRouter;