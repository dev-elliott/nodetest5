//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  // Server-side HTTP routing.
  // Handling get/post/put/delete data for users and their notifications
  //
  //  Notes:
  //	-Make sure the routes are in order. Routes w/ params come last in series
  //
  //  Todo:
  //	-Notifications (etc) need to return ONLY notifications, not the entire user object
  //	- so, users.findbyid(id, {notifications:1}) to include ONLY notifications
  //	-Updating a user, confirm you are that user
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var express 	= require('express');
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
var Users		= require('../models/user');
var Utility		= require("./utility");
var userRouter 	= express.Router();
userRouter.use(bodyParser.json());



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/userRouter.route('/')																			//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() 
	//	-Restrictions: Must be logged in as Admin
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, Utility.verifyAdmin, function(req, res, next) {
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
		Users.find({}/*{admin:{$in: [null, false]}}*/)
			.populate('companyId')
			.exec(function (err, users) {
				if(err) { return next(new Error("ERROR IN FIND - DATA GET/USERS: ", err)); }
				res.json(users);// res.json also sends response code # and headers :O
		});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/userRouter.route('/unclaimed/')																//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() users not linked with a company
	//	-Restrictions: Must be logged in as Admin
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, Utility.verifyAdmin, function(req, res, next) {
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
				if(err) { return next(new Error("ERROR IN FIND - GET DATA/USERS/UNCLAIMED: ", err)); }
				res.json(user);// res.json also sends response code # and headers :O
		});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/userRouter.route('/notifications')																//╣ done
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() 
	//	-Restrictions: Must be logged in 
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
		if(!(req.method == "GET" || req.method == "DELETE"))
			return next(new Error("HTTP method " + req.method + " is not supported on details/users/" + req.url));
		next();
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//  .get() all notifications for the user per ID
	//	-Restrictions: Must be logged in
	//	-Request 'userId' via url params
	//	-Response of all JSON formatted notification data for specified user
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//	---User has no notifications
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.get(function(req, res, next) {
		var oid = mongoose.Types.ObjectId(req.decoded._id.toString());
		Users.findById(oid, {notifications:1})
			.exec(function(err, user){
				if(err) { console.log("ERROR IN FINDING - DATA GET/USERID/NOTIFICATIONS, heres the error:",  err); return next(err); }
				if(!user) { console.log("We didn't find a user to pull notifications from..."); return next(err); }
				if(user.notifications.length <= 0) {res.json([{count: 0}, {type:"Success"}]); } //Filler JSON so we can query
				else {console.log("We sent your notifications, thanks"); res.json(user.notifications)};
		});
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.delete() all notifications for existing User by ID#
	//	-Restrictions: Must be logged in
	//  -Request 'userId' via url params
	// 	-Response confirming all the notifications were successfully deleted
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//	---User has no notifications
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.delete(function(req, res, next) {
		var oid = mongoose.Types.ObjectId(req.decoded._id.toString());
		Users.findById(oid, function(err, user){
			if(err) { console.log("ERROR IN FINDING - DATA DELETE/USER/USERID/NOTIFICATIONS: ",  err); return next(err); }

			if(!user.notifications.length > 0)
				res.json({result:"There are no notifications to delete!"});

			for(var i = (user.notifications.length -1); i >= 0; i--)
				{ user.notifications.pull(user.notifications[i]._id); }

			user.save(function(err, resp){
				if(err) { console.log("ERROR IN SAVING - DELETE DATA/USERID/NOTIFICATIONS: ",  err); return next(err); }
				//console.log("Deleted all notifications for user id#: " + req.params.userId);
				res.json({result:"Deleted all notifications."});
			});
		});
	});

//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/userRouter.route('/:userId')																	//╣ notify
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.all() 
	//	-Restrictions: Must be logged in to view your account, admin login for any other account
	//	-Handle any immediated errors with our request:
	//	-Method not supported (anything but get/post/delete)
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.all(Utility.verifyOrdinaryUser, function(req, res, next) {
		if(!(req.method == "GET" || req.method == "PUT" || req.method == "DELETE"))
			return next(new Error("HTTP method " + req.method + " is not supported on details/users/" + req.url));
		next();
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//  .get() one user by their ID
	//	-Restrictions: Must be logged in as Admin or getting your own userId
	//	-Request n/a
	//	-Repsonse of JSON format for all users
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.get(function(req, res, next) {
		if(!req.decoded.admin || req.decoded._id != req.params.userId)
			return next(new Error("You are not authorized to view this account"));
		else
		{
			Users.findById(req.params.userId)
				.populate('companyId')
				.exec(function (err, users) {
					if(err) { return next(new Error("ERROR IN FIND - DATA GET/USERS/USERID: ", err)); }
					res.json(users);// res.json also sends response code # and headers :O
			});
		}
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.put() update specific existing user by ID#
	//	-Restrictions: Available only to admin or self
	//  -Request 'userId' via url params and JSON format in body for user properties to update
	// 	-Response confirming the user was successfully updated
	// 	-Possible failures:
	// 	---Incorrect JSON format provided: this will cause a mongoose "ValidationError" to be thrown
	// 	---No JSON data provided. I throw my own error below, immediately when that's detected.
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.put(function(req, res, next) {
		if(!req.decoded.admin || req.decoded._id != req.params.userId)
			return next(new Error("You are not authorized to edit this account"));
		else
		{
			//Check for non-existant JSON body data before trying to validate/create it
			if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE USER WITH"));

			Users.findByIdAndUpdate(req.params.userId, { $set: req.body } , { new: true }, function(err,user) {
				if(err) { console.log("ERROR IN FIND&UPDATE - PUT DATA/USERS/USERID: ",  err); return next(err); }
				if(!req.body) return next(new Error("NO JSON BODY PROVIDED TO UPDATE THE USER WITH"));
				if(!req.decoded.admin) Utility.notifyAdmin("A user has been updated.");
				//console.log("Updated user # " + user._id + " with the following data: " + JSON.stringify(req.body));

				res.json({result:'Success'});
			});
		}
	})
	//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
	//	.delete() specific existing user by ID#
	//	-Restrictions: Available only to admin!
	//  -Request 'jobId' via url params
	// 	-Response confirming the user was removed from the database.
	// 	-Possible failures:
	// 	---Incorrect/invalid/non-existant ID#
	//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
	.delete(Utility.verifyAdmin, function(req, res, next) {
		Users.remove({"_id" : req.params.userId}, function(err, resp){
			if(err) { console.log("ERROR IN REMOVE - DELETE/JOBID: ",  err); return next(err); }
			console.log("Deleted user with id#: " + req.params.userId);
			res.json({result:"Success"});
		});
	});



module.exports = userRouter;