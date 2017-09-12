//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  // Server-side HTTP routing.
  // This handles any routes that fall outside the specific scope of auth, [db:]users/jobs/companies
  //
  //  Notes:
  //	- Is there a better way to structure this?
  //
  //  Todo:
  //	- Instead of a query, can I do a get here?
  //	- Rather than returning an array, couldn't I just 'inject' JSON {type: X} (job/co/user/failed)
  //	- into the actual find result (the job/co/user data) ????
  //	-	........... see if theres a way to determine (client side) what the type is and then just
  //	-				do a standard get, way more simple.....dont be bad.. v_v x_x z_z q_q p_p d_b
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var express 	= require('express');
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
var Jobs 		= require('../models/jobs');
var Companies	= require('../models/companies');
var Users		= require('../models/user');
var Utility		= require("./utility");
var config      = require('../config');
var dataRouter 	= express.Router();

dataRouter.use(bodyParser.json());


dataRouter.route('/test')
.get(function(req,res,next)
{
	var data = [{}];
	var myjob;
	var mycompany;
	var myuser;
	Jobs.findOne({}).populate('company').exec(function(err, job){
		if(err) console.log(err);
		myjob = job;
	
		Users.findOne({}).exec(function(err, user){
			if(err) console.log(err);
			myuser = user;
	
			Companies.findOne({}).exec(function(err, co){
				if(err) console.log(err);
				mycompany = co;
				var obj1 = {};
				var obj2 = {};
				obj1 = obj2 = {};
	
	// case('Job-New'):
	// //*Rainier View* has submit a *new job*
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	obj2.id = myjob._id;
	data[0] = {type:"Job-New", body:Utility.generateNotificationHTML("Job-New", mycompany, myjob)}; obj1 = obj2 = {};


	// case('Job-Edit'):
	// //*Rainier View* has modified *job # 16-0508*
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	obj2.id = myjob._id;
	obj2.number = myjob.jobNumber;
	data[1] = {body:Utility.generateNotificationHTML("Job-Edit", mycompany, myjob)}; obj1 = obj2 = {};
	
	// //*Rainier View* has modified a *pending job*
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	obj2._id = myjob._id;
	obj2.number = "Pending";
	data[2] = {body:Utility.generateNotificationHTML("Job-Edit", mycompany, obj2)}; obj1 = obj2 = {};

	// case('User-New'):
	// //A *new user* has been registered; *set their company*
	obj1.id = myuser._id;
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	data[3] = {body:Utility.generateNotificationHTML("User-New", myuser, null)}; obj1 = obj2 = {};

	// case('User-Edit'):
	// //*John Doe* has edited their profile
	obj1.id = myuser._id;
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	data[4] = {body:Utility.generateNotificationHTML("User-Edit", myuser, null)}; obj1 = obj2 = {};

		
	// case('Company-New'):
	// //*Advanced Plumbing* has been registered
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	data[5] = {body:Utility.generateNotificationHTML("Company-New", mycompany, null)}; obj1 = obj2 = {};
	
	// case('Company-Edit'):
	// //*Rainier View* has edited their profile.
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	data[6] = {body:Utility.generateNotificationHTML("Company-Edit", mycompany, null)}; obj1 = obj2 = {};
	
	// case('Request-New'):
	// //Anonymous has submit a *new inquiry*
	obj1.id = mycompany._id; //this should actually be myInquery._id but we dont have any in the system yet
	data[7] = {body:Utility.generateNotificationHTML("Request-New", mycompany, null)}; obj1 = obj2 = {};

	// //*John Doe* has submit a *new inquiry*
	obj1.id = mycompany._id;
	obj2.id = myuser._id;
	obj2.firstname = myuser.firstname;
	obj2.lastname = myuser.lastname;
	data[8] = {body:Utility.generateNotificationHTML("Request-New", mycompany, myuser)}; obj1 = obj2 = {};


	// case('Comment-New'):
	//*John Doe* has posted a comment on job # *16-0236*
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	obj1.id = myuser._id;
	obj2.id = myjob._id;
	obj2.number = myjob.jobNumber;
	data[9] = {body:Utility.generateNotificationHTML("Comment-New", myuser, myjob)}; obj1 = obj2 = {};

	res.json(data);
			});
		});
	});
});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/dataRouter.route('/details/:id')																//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() 
	//	-Restrictions: Must be logged in
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
		if(!(req.method == "GET"))
			return next(new Error("HTTP method " + req.method + " is not supported on details/users/" + req.url));
		next();
	})
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
				.populate('company')
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