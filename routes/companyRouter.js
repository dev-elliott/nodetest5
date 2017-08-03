//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  // Server-side HTTP routing.
  // Handling get/post/put/delete data for companies
  //
  //  Notes:
  //	-Make sure the routes are in order. Routes w/ params come last in series
  //
  //  Todo:
  //	-Populating when getting all companies, what data do we want to pull from DB?
  //	-
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var express 		= require('express');
var bodyParser 		= require('body-parser');
var mongoose 		= require('mongoose');
var Companies		= require('../models/companies');
var Utility			= require("./utility");
var companyRouter 	= express.Router();
companyRouter.use(bodyParser.json());



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/companyRouter.route('/')																		//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() 
	//	-Restrictions: Must be logged in as Admin
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, Utility.verifyAdmin, function(req, res, next) {
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
	// 	-Response confirming the company was successfully created, and printing the ID#
	// 	-Possible failures:
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.post(function(req, res, next) {
		//Check for non-existant JSON body data before trying to validate/create it
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO CREATE THE JOB WITH"));

		Companies.create(req.body, function(err, company) {
			if(err) { console.log("ERROR IN CREATE - POST DATA/COMPANIES: ",  err); return next(err); }
			//console.log("New company created: " + company.name + "\nCOMPANY#: " + company._id);
			res.json({result:company._id});
		});
	});



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/companyRouter.route('/:companyId')																//╣ notify
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() specific company
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
	//  .get() specific existing company by ID#
	//	-Restrictions: Must be logged in as admin or employee
	//	-Request 'companyId' via url params
	//	-Response of JSON format for specified company
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.get(function(req, res, next) {
		if(!req.decoded.admin/* || req.decoded.companyId != req.params.companyId*/)
			return next(new Error("You are not authorized to view this company"));
		else
		{
			if(req.params.companyId == "names")
			{
				Companies.find({},{name:1}).exec(function(err, companies)
				{
					if(err)
					{
						console.log("ERROR IN FIND - GET/COMPANIES/COMPANYID (NAMES ONLY)",  err);
						return next(new Error("Error pulling company names...sorry!"));
					}
					res.json(companies);
					return;
				});
			}
			else
			{
				Companies.findById(req.params.companyId)
					.populate("comments.author")
					.exec(function(err, company){
						if(err)
						{
							console.log("ERROR IN FIND - GET DATA/COMPANIES/COMPANYID: ",  err);
							//Is this the only error that findById will throw? Not finding the entry??
							return next(new Error("No company in database with ID# " + req.params.companyId));
						}
						res.json(company);
				});
			}
		}
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.put() update specific existing company by ID# -- add job or employee to their respective array
	//	-Restrictions: Available only to admin or employee
	//  -Request company companyId via url params and JSON format in body for company properties to update
	// 	-Response confirming the company was successfully updated
	// 	-Possible failures:
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.put(Utility.verifyCompanyOrAdmin, function(req, res, next) {

		//Check for non-existant JSON body data before trying to validate/create it
		if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE COMPANY WITH"));

		Companies.findByIdAndUpdate(req.params.companyId, { $set: req.body } , { new: true }, function(err,company) {
			if(err) { console.log("ERROR IN FIND&UPDATE - PUT/JOBID: ",  err); return next(err); }
			if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE JOB WITH"));
			if(!req.decoded.admin) Utility.notifyAdmin("A company has been updated.");
			//console.log("Updated company # " + company._id + " with the following data: " + JSON.stringify(req.body));
			res.json({result:"Success"});
		});
		
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.delete() specific existing company by ID#
	//	-Restrictions: Available only to admin!
	//  -Request 'companyId' via url params
	// 	-Response confirming the company was removed from the database.
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.delete(Utility.verifyAdmin, function(req, res, next) {
		Jobs.remove({"_id" : req.params.companyId}, function(err, resp){
			if(err) { console.log("ERROR IN REMOVE - DELETE/JOBID: ",  err); return next(err); }
			//console.log("Deleted company with id#: " + req.params.companyId);
			//I imagine at some point we'll want to render a full on specific "deletion success" page
			res.json({result:"Success"});
		});
	});



module.exports = companyRouter;