//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  // Server-side HTTP routing.
  // Handling registering and logging in/out of users
  //
  //  Notes:
  //
  //  Todo:
  //	-When generating a token, what information should we provide? We learned username and ID
  //	 but what about adding the admin flag?
  //	---> Ended up also passing admin + company
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
var express 	= require('express');
var passport 	= require('passport');
var User 		= require('../models/user');
var Utility 	= require('./utility');
var router 		= express.Router();



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/router.post('/register', function(req, res) {													//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	if(!req.body) return next(res.status(401).json({err: "No req.body JSON data provided to register with LOL"}));
	
	//any REQUIRED=TRUE fields (from the mongoose model) must be set when you first do 'new User({...})' !!
	User.register(new User({username : req.body.username, company: req.body.company}), req.body.password, function(err, user){
		if(err) { console.log("Error registering new user: ", err); return res.status(500).json({err : err}); }
		if(req.body.firstname) { user.firstname = req.body.firstname; }
		if(req.body.lastname) { user.lastname = req.body.lastname; }
		//We manually set the
		//if(req.body.company) { user.company = req.body.company; } 
		
		user.save(function(err,user) {
			passport.authenticate('local')(req, res, function() {
				return res.status(200).json({status: "Registration successful hoe"});
			});
		});
	});
	});



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/router.post('/login', function(req,res,next) {													//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	passport.authenticate('local', function(err, user, info) {
		if(err) { return next(err); }
		if(!user) { return res.status(401).json({err:info}); }
		req.logIn(user, function(err) {
			if(err) { return res.status(500).json({err: "Couldn't log in user"}); }
		});

		//Create a variable to easily hold and pass the information to the token
		var userData = {};
		userData.username = (user.firstname + " " + user.lastname); console.log("Logging in this user: ", userData.username);
		userData._id = user._id;
		userData.admin = user.admin;
		userData.company = user.company;

		var token = Utility.getToken(userData);

		//Instead of passing it all in like this: (old version)
		//var token = Utility.getToken({"username":fullname, "_id":user._id, "admin":user.admin, "company":user.company});


		res.status(200).json({
			status: "Login successful!",
			success: true,
			token: token
		});
	})(req, res, next);
	});



//╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
/*╠*/router.get('/logout', function(req, res) {														//╣ 
//╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
	req.logout();
	//We also want to destroy the token at this time, so the user has to re-authenticate to log back in
	res.status(200).json({ status: "You've logged out kthxbai."});
	});



module.exports = router;