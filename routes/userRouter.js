var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Verify = require('./Verify');

router.post('/register', function(req, res) {
	if(!req.body) return next(res.status(401).json({err: "No req.body JSON data provided to register with LOL"}));
	
	//any REQUIRED=TRUE fields must be set when you first do 'new User({...})' !!
	User.register(new User({username : req.body.username, company: req.body.company}), req.body.password, function(err, user){
		//console.log("user-->", user);
		if(err) { console.log("Error registering new user: ", err); return res.status(500).json({err : err}); }
		if(req.body.firstname) { user.firstname = req.body.firstname; }
		if(req.body.lastname) { user.lastname = req.body.lastname; }
		//if(req.body.company) { user.company = req.body.company; }
		
		user.save(function(err,user) {
			passport.authenticate('local')(req, res, function() {
				return res.status(200).json({status: "Registration successful hoe"});
			});
		});
	});
});

router.post('/login', function(req,res,next) {
	passport.authenticate('local', function(err, user, info) {
		if(err) { return next(err); }
		if(!user) { return res.status(401).json({err:info}); }
		req.logIn(user, function(err) {
			if(err) { return res.status(500).json({err: "Couldn't log in user"}); }
		});
		console.log("User in users: ", user);
		var token = Verify.getToken({"username":user.username, "_id":user._id, "admin":user.admin});
		console.log("here is the token:");
		console.log(token);
		console.log("token.admin?: ", token.admin);

		res.status(200).json({
			status: "Login successful!",
			success: true,
			token: token
		});
	})(req, res, next);
});

router.get('/logout', function(req, res) {
	req.logout();
	//We also want to destroy the token at this time, so the user has to re-authenticate to log back in
	res.status(200).json({ status: "You've logged out kthxbai."});
});


module.exports = router;