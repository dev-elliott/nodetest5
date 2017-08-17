//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Server-side helper functions:
  //	- validate & generate tokens. Used when verifying users & admins
  //	- generate notification strings
  //
  //  Notes:
  //
  //  Todo:
  //	-test 'Request-New' notification HTML generation. need to add some to the DB
  //	-Generate new functions to help in route verification:
  //		-confirmEmployee(job, user) determine that the user and job both belong to same company
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
	exports.getToken = function(user)
	{
		//ExpiresIn = amount of seconds
		return jwt.sign(user, config.secretKey, {expiresIn: 36000});
		// return jwt.sign(user, config.secretKey, {expiresIn: 15});
	};
	exports.verifyOrdinaryUser = function(req, res, next)
	{
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
					{

						console.log("The token has expired, sorry");
						//When you create a new Error and pass it a param, it sets that string to "message"
						var error = new Error("tokenexpired");
						error.status = 401; //401 is not authorized
						//So we're returning {error} with .message (= "token expired") and .status (= 401)
						return next(error);
					}
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
	exports.verifyAdmin = function(req, res, next)
	{
		if(!req.decoded.admin)
		{
			var err = new Error("You are not an admin");
			err.status = 403;
			return next(err);
		}
		else
			return next();
	};
	exports.verifyCompanyOrAdmin = function(req, res, next)
	{
		if(req.decoded.admin)
		{
			return next();
		}
		if(req.params.companyId == req.decoded.company)
		{
			return next();
		}
		var err = new Error("You are not an authorized employee or admin");
		err.status = 403;
		return next(err);
	};
	exports.confirmEmployee = function(req, res, next)
	{
		//employee = req.decoded._id;
		//company = 
	};

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ NOTIFICATIONS																					//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	exports.generateNotificationHTML = function(type, obj1, obj2)
	{
		var link1;
		var link2;
		if(obj1) link1 = config.baseURL + "#!/detail/" + obj1.id;
		if(obj2) link2 = config.baseURL + "#!/detail/" + obj2.id;

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
				if(obj2.jobNumber == "Pending" || obj2.jobNumber == null || obj2.jobNumber == "")
					return '<a href="'+link1+'">'+obj1.name+'</a> has modified a <a href="'+link2+'">pending job</a>';
				else
					return '<a href="'+link1+'">'+obj1.name+'</a> has modfied job # <a href="'+link2+'">'+obj2.jobNumber+'</a>';
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
	};
	exports.notifyAdmin = function(type, obj1, obj2)
	{
		Users.findOne({"admin":true}).exec(function (err, admin) {
			if(err || !admin) {return next(new Error("ERROR FINDING ADMIN ACCOUNT TO NOTIFY: ", err)); }

			var bdy = exports.generateNotificationHTML(type, obj1, obj2);
			admin.notifications.push({body: bdy});
			admin.save(function(err, admin){
				if(err) { console.log("Had an error saving to admin"); return next(err); }
				else
					console.log("Successfully notified admin" + admin.username + "for a total of: " + admin.notifications.length);
			});
		
		});
	};
	exports.notifyAdminMessage = function(message)
	{
		Users.findOne({"admin":true})
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
	

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
//╠ UTILITY FUNCS																					//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	exports.setEmployee = function(oldCompanyId, newCompanyId, userId)
	{
		console.log("Here is the oldcompanyId:", oldCompanyId);
		console.log("Here is the newcompanyId:", newCompanyId);


		//This is enraging faggotry but it should work.
		//Right now, the set company dropdown provides a blank option...
		//If that's selected it sends the newCompanyId as the entire current company.
		//So lets just check if newCompanyId is an object, and if so, just pass the ID.
		if(newCompanyId === Object(newCompanyId))
		{
			console.log("blank case detected...");
			newCompanyId = newCompanyId._id;
			console.log(newCompanyId + " is our new data to send");
		}


		if(oldCompanyId === newCompanyId)
		{
			console.log("No employment change to be made");
			return;
		}
		else
		{
			//If there is an old company provided we need to remove the employee
			if(oldCompanyId && oldCompanyId != null)
			{
				removeEmployee(oldCompanyId, userId);
			}

			//If there is a new company provided we need to add the employee
			if(newCompanyId && newCompanyId != null)
			{
				addEmployee(newCompanyId, userId);
			}
		}
	};
	exports.addEmployee = function(companyId, userId)
	{
		//Each company knows who it's employees are; we call this function when we (the admin)
		//sets the users company (ID) from the Dashboard:Users


		//This will grab the company by ID and load all it's employees (array of user ids)
		//and add the new employee user ID if it doesn't already exist in the list.

		Companies.findById(companyId)
			.exec(function(err, company)
			{
				console.log("We found this company that you want to fuck with: " + company._id);
				console.log(company.employees);
				if(err) { console.log("ERROR: Couldn't load company to add employee"); return; }
				
				//Check to see if the user is already in the list. If so, return; we're done here
				for (var i = 0; i < company.employees.length; i++) {
			        if (company.employees[i].equals(userId)) {
			            console.log("Employee already in Company.");
						return;
			        }
			    }
				


				//If we made it this far, employee needs to be added:
				console.log("Adding employee to company.");
				company.employees.push(userId);
				company.save(function(err) 
				{
					if(err) { console.log("ERROR: Saving company"); return; }
					else {console.log("Saved new employee to company"); return; }

				});
				

			});
	};	
	exports.removeEmployee = function(companyId, userId)
	{
		//Each company knows who it's employees are; we call this function when we (the admin)
		//change the users company (ID) from the Dashboard:Users


		//This will grab the company by ID and load all it's employees (array of user ids)
		//and add the new employee user ID if it doesn't already exist in the list.

		Companies.findById(companyId)
			.exec(function(err, company)
			{
				if(err) { console.log("ERROR: Couldn't load company to add employee"); return; }

				//If there are no employees yet (null) then theres nothing to do here
				if(!company.employees) {console.log("No employees in company, noting to remove."); return;}
				
				var index = company.employees.indexOf(userId);
				if(index < 0 || index == null) { console.log("User isn't listed as an employee, all done here"); return; }
				if(company.employees[index].equals(userId))
				{
					if(index > -1) company.employees.splice(index, 1);

					console.log("removing employee from company.");
					company.save(function(err) 
					{
						if(err) { console.log("ERROR: Saving company"); return; }
						else {console.log("Saved new employee removal from company"); return; }

					});
				}
				else
				{
					console.log("employee isnt in company.");
				}

			});
	};