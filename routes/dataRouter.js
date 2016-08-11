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
dataRouter.use(bodyParser.json());



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