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
var dataRouter 	= express.Router();

  var config        = require('../config');

dataRouter.use(bodyParser.json());


	function generateNotificationHTML(type, obj1, obj2)
	{

		//console.log("Here are are in the function faggot");
		//console.log("Here is obj1: ", obj1);
		//console.log("Here is obj2: ", obj2);
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
				if(obj2.number != "Pending" && obj2.number != null && obj2.number != "")
					return '<a href="'+link1+'">'+obj1.name+'</a> has modfied job # <a href="'+link2+'">'+obj2.number+'</a>';
				else
					return '<a href="'+link1+'">'+obj1.name+'</a> has modified a <a href="'+link2+'">pending job</a>';
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
	data[0] = {type:"Job-New", body:generateNotificationHTML("Job-New", obj1, obj2)}; obj1 = obj2 = {};


	// case('Job-Edit'):
	// //*Rainier View* has modified *job # 16-0508*
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	obj2.id = myjob._id;
	obj2.number = myjob.jobNumber;
	data[1] = {body:generateNotificationHTML("Job-Edit", obj1, obj2)}; obj1 = obj2 = {};
	// //*Rainier View* has modified a *pending job*
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	obj2.id = myjob._id;
	obj2.number = "Pending";
	data[2] = {body:generateNotificationHTML("Job-Edit", obj1, obj2)}; obj1 = obj2 = {};

	// case('User-New'):
	// //A *new user* has been registered; *set their company*
	obj1.id = myuser._id;
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	data[3] = {body:generateNotificationHTML("User-New", obj1, null)}; obj1 = obj2 = {};

	// case('User-Edit'):
	// //*John Doe* has edited their profile
	obj1.id = myuser._id;
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	data[4] = {body:generateNotificationHTML("User-Edit", obj1, null)}; obj1 = obj2 = {};

		
	// case('Company-New'):
	// //*Advanced Plumbing* has been registered
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	data[5] = {body:generateNotificationHTML("Company-New", obj1, null)}; obj1 = obj2 = {};
	
	// case('Company-Edit'):
	// //*Rainier View* has edited their profile.
	obj1.id = mycompany._id;
	obj1.name = mycompany.name;
	data[6] = {body:generateNotificationHTML("Company-Edit", obj1, null)}; obj1 = obj2 = {};
	
	// case('Request-New'):
	// //Anonymous has submit a *new inquiry*
	obj1.id = mycompany._id; //this should actually be myInquery._id but we dont have any in the system yet
	data[7] = {body:generateNotificationHTML("Request-New", obj1, null)}; obj1 = obj2 = {};

	// //*John Doe* has submit a *new inquiry*
	obj1.id = mycompany._id;
	obj2.id = myuser._id;
	obj2.firstname = myuser.firstname;
	obj2.lastname = myuser.lastname;
	data[8] = {body:generateNotificationHTML("Request-New", obj1, obj2)}; obj1 = obj2 = {};


	// case('Comment-New'):
	//*John Doe* has posted a comment on job # *16-0236*
	obj1.firstname = myuser.firstname;
	obj1.lastname = myuser.lastname;
	obj1.id = myuser._id;
	obj2.id = myjob._id;
	obj2.number = myjob.jobNumber;
	data[9] = {body:generateNotificationHTML("Comment-New", obj1, obj2)}; obj1 = obj2 = {};



	// console.log("Here is our dataaaa okay?");
	// 	for(var d in data)
	// 	{
	// 		console.log(data[d]);
	// 	}
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