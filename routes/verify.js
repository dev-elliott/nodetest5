var User = require('../models/user');
var jwt = require('jsonwebtoken');
var config = require('../config');

//ExpiresIn amount of seconds
exports.getToken = function(user){
	return jwt.sign(user, config.secretKey, {expiresIn: 3600});
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
				var err = new Error("You are not authenticated per verifyOrdinaryUser");
				err.status = 401; //401 is not authorized
				return next(err);
			}
			else
			{
				//Verify checks out, let's save the decoded information
				req.decoded = decoded;
				next();
			}
		});
	}
	else
	{
		//No token found QQ
		var err = new Error("No token provided to verify (ordinary user) with!");
		err.status = 403; //403 is forbidden
		return next(err);
	}
};

exports.verifyAdmin = function(req, res, next){
	if(!req.decoded.admin)
	{
		var err = new Error("You are not an admin");
		err.status = 403;
		return next(err);
	}
	else
		next();
};