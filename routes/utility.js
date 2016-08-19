//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Server-side helper functions:
  //	- validate & generate tokens. Used when verifying users & admins
  //	- generate notification strings
  //
  //  Notes:
  //
  //  Todo:
  //	-test 'Request-New' notification HTML generation. need to add some to the DB
  //	-When we confirm the token is expired, we need to let the client know so it can logout
  //	 and prompt the user to log in again
  //	-Generate two new functions to help in route verification:
  //		-confirmEmployee(job, user) determine that the user and job both belong to same company
  //		-confirmAdmin(user) return true/false if the user ia an admin
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ REQUIRES / GLOBALS																				//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	var mongoose 	= require('mongoose');
	var Users 		= require('../models/user');
	var Companies	= require('../models/companies');
	var Jobs		= require('../models/jobs');
	var jwt 		= require('jsonwebtoken');
	var config 		= require('../config');
	//How to declare a lookup table that saves the values and can be accessed across the server...?
	//global.lookupTable = {};
	//exports.lookupTable = lookupTable;
//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ VERIFICATION / TOKENS																			//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	exports.getToken = function(user){
		//ExpiresIn = amount of seconds
		return jwt.sign(user, config.secretKey, {expiresIn: 36000});
	};

	exports.verifyOrdinaryUser = function(req, res, next){
		//Check header or URL Params or post params for token
		var token = req.body.token || req.query.token || req.headers['x-access-token'];

		//decode the token if it's found
		if(token)
		{
			//verifies secret and checks expiration
			jwt.verify(token, config.secretKey, function(err, decoded){
				if(err)
				{
					//We have a token, but it isn't verified. 
					//Either an invalid signature (unlikely) or expired.
					if(err.name == 'TokenExpiredError')
						console.log("The token has expired, sorry");
					//Prompt the user to log in again
					//Make sure angular knows you've been logged out (rootscope broadcast??)
					var err = new Error("You are not authenticated per verifyOrdinaryUser");
					err.status = 401; //401 is not authorized
					return next(err);
				}
				else
				{
					//Verify checks out, let's save the decoded information
					req.decoded = decoded;
					return next();
				}
			});
		}
		else
		{
			//No token found QQ
			//I would assume this means user hasn't tried to login at all yet (or has logged out)
			//At this point we should prompt them to login
			var err = new Error("No token provided to verify (ordinary user) with!");
			err.status = 403; //403 is forbidden
			return next(err);
		}
	};

	//This function is designed to be called after verifyOrdinaryUser since we are expecting the token to already be 
	//decoded and saved into the req object
	exports.verifyAdmin = function(req, res, next){
		if(!req.decoded.admin)
		{
			var err = new Error("You are not an admin");
			err.status = 403;
			return next(err);
		}
		else
			return next();
	};

	exports.verifyCompanyOrAdmin = function(req, res, next){
		if(!req.decoded.admin || req.params.companyId != req.decoded.companyId)
		{
			var err = new Error("You are not an authorized employee or admin");
			err.status = 403;
			return next(err);
		}
		else
			return next();
	};

	exports.confirmEmployee = function(req, res, next)
	{
		//employee = req.decoded._id;
		//company = 
	};

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ NOTIFICATIONS																					//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	exports.notifyAdminNEW = function(type, obj1, obj2)
	{
		console.log("Going to notify admin .......");
		Users.findOne({admin:true})
		.exec(function (err, admin) {

			if(err) { return next(new Error("ERROR FINDING ADMIN ACCOUNT TO NOTIFY: ", err)); }
			if(admin)
			{
				var bdy = generateNotificationHTML(type, obj1, obj2);
				//console.log("Here is the body of our notify: ", bdy);
				admin.notifications.push({body: bdy});
				admin.save(function(err, admin){
					if(err) { return next(err); }
					//else
					//	console.log("Successfully notified admin for a total of: " + admin.notifications.length);
				});
			}
		});
	};

	exports.notifyAdmin = function(message)
	{
		//console.log("Going to notify admin that " + message);
		Users.findOne({admin:true})
		.exec(function (err, admin) {

			if(err) { return next(new Error("ERROR FINDING ADMIN ACCOUNT TO NOTIFY: ", err)); }
			if(admin)
			{
				admin.notifications.push({body: message});
				admin.save(function(err, admin){
					if(err) { return next(err); }
					//else
					//	console.log("Successfully notified admin for a total of: " + admin.notifications.length);
				});
			}
		});
	};

	exports.notifyUser = function(userId, message)
	{
		Users.find({_id:userId})
		.exec(function (err, user) {
			if(err) { return next(new Error("ERROR FINDING USER ACCOUNT TO NOTIFY: ", err)); }
			else if(user)
			{
				user.notifications.push({body: message});
				user.save(function(err, user){
					if(err) { console.log("ERROR IN SAVING NEW USER NOTIFICATION: ",  err); return next(err); }
					//else
					//	console.log("Successfully notified user for a total of: " + user.notifications.length);
				});
			}
		});
	};


	function generateNotificationHTML(type, obj1, obj2)
	{
		var link1;
		var link2;

		if(obj1) link1 = config.baseURL + "#/detail/" + obj1.id;
		if(obj2) link2 = config.baseURL + "#/detail/" + obj2.id;


		switch(type)
		{
			case('Job-New'):
				//*Rainier View* has submit a *new job*
				//obj1 = company, obj2 = job
				if(link1 && link2)
				{
					return '<a href="'+link1+'">'+obj1.name+'</a> has submit a <a href="'+link2+'">new job</a>';
				}
			break;

			case('Job-Edit'):
				//*Rainier View* has modified *job # 16-0508*
				//*Rainier View* has modified a *pending job*
				//obj1 = company, obj2 = job

				//If the job has been confirmed by admin (and a number has been generated)
				//jobNumber defaults to Pending but this catches other non-generated cases to be safe
				if(obj2.number == "Pending" || obj2.number == null || obj2.number == "")
					return '<a href="'+link1+'">'+obj1.name+'</a> has modified a <a href="'+link2+'">pending job</a>';
				else
					return '<a href="'+link1+'">'+obj1.name+'</a> has modfied job # <a href="'+link2+'">'+obj2.number+'</a>';
			break;
			
			case('User-New'):
				//A *new user* has been registered; *set their company*
				return 'New user <a href="'+link1+'">'+obj1.firstname+' '+obj1.lastname+'</a> has registered. ';
			break;

			case('User-Edit'):
				//*John Doe* has edited their profile
				return 'User <a href="'+link1+'">'+obj1.firstname+' '+obj1.lastname+'</a> has modified their profile. ';
			break;

			case('Company-New'):
				//*Advanced Plumbing* has been registered
				return 'New company <a href="'+link1+'">'+obj1.name+'</a> has been created.';
			break;

			case('Company-Edit'):
				//*Rainier View* has edited their profile.
				return '<a href="'+link1+'">'+obj1.name+'</a> has modified their profile.';
			break;

			//STILL NEEDS TO BE TESTE!!!!!!!!1
			case('Request-New'): 
				//Anonymous has submit a *new inquiry*
				if(!obj2) return 'An anonymous visitor has submit a <a href="'+link1+'">new inquiry</a>.';
				//*John Doe* has submit a *new inquiry*
				else return 'User <a href="'+link2+'">'+obj2.firstname+' '+obj2.lastname+'</a> has submit a <a href="'+link1+'">new inquiry</a>';
			break;

			case('Comment-New'):
				//*John Doe* has posted a comment on job # *16-0236*
				return '<a href="'+link1+'">'+obj1.firstname+' '+obj1.lastname+'</a> has commented on job # <a href="'+link2+'">'+obj2.number+'</a>';
			break;
		}
	}
//
	// exports.generateLookup = function()
	// {
	// 	console.log("Generating lookup table...");
	// 	Users.find({}, {firstname:1, lastname:1}).exec(function (err, users){
	// 		for(user in users)
	// 		{
	// 			lookupTable[user._id] = (user.firstname + " " + user.lastname);
	// 			console.log(user._id + " , " + user.firstname+ " , " + user.lastname);
	// 		}
	// 		Companies.find({}, {name:1}).exec(function (err, cos){
	// 			for(co in cos)
	// 			{
	// 				lookupTable[co._id] = co.name;
	// 			}
	// 			Jobs.find({}, {name:1, jobNumber:1, status:1}).exec(function (err, jobs){
	// 				for(job in jobs)
	// 				{
	// 					lookupTable[job._id] = {name: job.name, number: job.jobNumer, status:job.status};
	// 					//lookupTable[job._id].number = jobs.jobNumber;
	// 					//lookupTable[job._id].status = jobs.status;
	// 				}
	// 				console.log("completed lookup with length=", lookupTable.length);
	// 			});
	// 		});
	// 	});
	// };

	// exports.updateLookupWithObj = function(type, id, obj)
	// {
	// 	switch(type)
	// 	{
	// 		case("User"):
	// 			lookupTable[id] = (obj.firstname + " " + obj.lastname);
	// 		break;
	// 		case("Company"):
	// 			lookupTable[id] = obj.name;
	// 		break;
	// 		case("Job"):
	// 			lookupTable[id] = {name: obj.name, number: obj.jobNumer, status:obj.status};
	// 			//lookupTable[id].number = obj.jobNumber;
	// 			//lookupTable[id].status = obj.status;
	// 		break;
	// 	}
	// }

	// exports.updateLookupById = function(type, id)
	// {
	// 	switch(type)
	// 	{
	// 		case("User"):
	// 			Users.findById(id, {firstname:1, lastname:1}).exec(function(err, user){
	// 				lookupTable[id] = (user.firstname + " " + user.lastname);
	// 			});
	// 		break;
	// 		case("Company"):
	// 			Companies.findById(id, {name:1}).exec(function(err, co){
	// 				lookupTable[id] = co.name;
	// 			});
	// 		break;
	// 		case("Job"):
	// 			Jobs.findById(id, {name:1, jobNumber:1, status:1}).exec(function (err, job){
	// 				lookupTable[id] = {name: job.name, number: job.jobNumer, status:job.status};
	// 				//lookupTable[id].number = job.jobNumber;
	// 				//lookupTable[id].status = job.status;
	// 			});
	// 		break;
	// 	}
	// }
//