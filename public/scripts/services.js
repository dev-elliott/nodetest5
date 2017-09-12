//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Factories and services for interacting with our backend.
  //
  //  apexFactory 
  //    ► Resource(HTTP) calls to the server
  //    ► Handles jobs/users/notifications/companies
  //
  //  localStorage
  //    ► Handles reading/writing our local storage keys/values (login credentials and token)
  //
  //  AuthFactory
  //    ► Processes logging in/out, registering, and saving/loading credentials ("remember me?")
  //    ► Allows us to access user details (isAdmin, getUserName etc)
  //
  //  Notes:
  //
  //  Todo:
  //    -AuthFactory needs to encrypt your credentials prior to localstorage save ("remember me?")
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘

angular.module('anguApp')
.constant("baseURL", "http://localhost:8080/")
//To use factories or services....?
//To have one master factory for all data
//or to have jobFac, userFac, companyFac, etc
.factory('apexFactory', ['$resource', 'baseURL', function($resource, baseURL)
{
	var apexFac = {};

  apexFac.GetTestData = function()
  {
    return $resource(baseURL + "data/test", null, null);
  }
  apexFac.GetUnclaimedUsers = function()
  {
    return $resource(baseURL + "users/unclaimed", null, null);
  }
  apexFac.GetNotifications = function() {
    //Returns an array of notifications
    //If there are none, we get:
      //response[0] = {count: 0}
      //response[1] = {type: "Success"}
    return $resource(baseURL + "users/notifications", null, {'Delete':{method:'DELETE'}});
  }
	apexFac.GetUsers = function()	{
    return $resource(baseURL + "users/:_id", null, {'Update':{method:'PUT'}});
	}
  apexFac.GetDetails = function() {
    return $resource(baseURL + "data/details/:_id", null, {'Update':{method:'PUT'}});
  }
	apexFac.GetJobs = function() {
		return $resource(baseURL + "jobs/:_id", null, {'Update':{method:'PUT'}, 'Save':{method:'POST'}, 'Delete':{method:'DELETE'}, 'Request':{method:'POST'}});
  }
	apexFac.GetCompanies = function()	{
		return $resource(baseURL + "companies/:_id", null, {'Update':{method:'PUT'}, 'Save':{method:'POST'}, 'Delete':{method:'DELETE'}});
	}
  apexFac.GetCompanyNames = function() {
    return $resource(baseURL + "companiesnames", null, null);
  }
	return apexFac;
}])

.factory('$localStorage', ['$window', function ($window) {
    return {
        store: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        remove: function (key) {
            $window.localStorage.removeItem(key);
        },
        storeObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key, defaultValue) {
            return JSON.parse($window.localStorage[key] || defaultValue);
        }
    }
}])


.factory('AuthFactory', ['$resource', '$http', '$localStorage', '$rootScope', '$window', 'baseURL', 'ngDialog', function($resource, $http, $localStorage, $rootScope, $window, baseURL, ngDialog){

	var authFac = {};              //Our factory object which holds methods below for other controllers to call (like login)
	var TOKEN_KEY = 'Token';       //Just the name of the of the stored key in the browser
	var isAuthenticated = false;   //We're not yet auth'd
  var isAdmin = false;           //If the user is an admin
  var _id = null;                //User database _id
	var username = '';             //The actual first and last name of the user, not their login (email)
  var company = '';              //The ID of users company
	var authToken = undefined;     //The actual TOKEN we get from the server


  //This function checks to see if we have a token saved in our browser local storage
	function LoadUserCredentials()
	{
    //Grab the token from local storage...
		var credentials = $localStorage.getObject(TOKEN_KEY, '{}');

    //If we got data, lets use it
		if(credentials.username != undefined)
    {
			UseCredentials(credentials);
    }
    //If for some reason the data is bad (no username) or some other error
    //lets reset our variables and delete the localstorage'd token
    else
    {
      DestroyUserCredentials();
    }
	}

  //This function saves to local storage:
    //The username the user logged in with (aka email)
    //The token provided by the server after a successful login
  //which would be used to reauthenticate and get a new token (not yet implemented!!)
	function StoreUserCredentials(credentials)
	{
    //Save the credentials (login name and token) in browser local storage
		$localStorage.storeObject(TOKEN_KEY, credentials);
		UseCredentials(credentials);
	}

  //This function takes our token, parses it, and stores all that data into our variables
	function UseCredentials(credentials) 
	{
    //Credentials is an object with a username (the login name, aka email for a user)
    //and the token, from local storage (which gets created after login)
        //console.log("caller of UseCredentials is " + arguments.callee.caller.name.toString());
        //console.log("HEY: here are our credentials data");
        //console.log(credentials);

		authToken = credentials.token;  //Save the actual token into our variable
    //Proceed to parse the token, and save that back into credentials
    var base64Url = credentials.token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    credentials = JSON.parse($window.atob(base64));
    //credentials now holds the "payload" of the token
        //console.log("OK: Here it is, parsed:");
        //console.log(credentials);

    //Apparently we are authenticated (??? honestly not sure what this is for yet)
    isAuthenticated = true;
    //Grab the data we got from the server (thru the parsed token) and save it
    isAdmin = credentials.admin;
    username = credentials.username;
    _id = credentials._id;
    company = credentials.company;

		//Set the token as header for our requests
		$http.defaults.headers.common['x-access-token'] = authToken;
	}

  //This function will clean up local variables and destroy the local storage token
  //we want to do this when we log out (or when token expires???)
	function DestroyUserCredentials()
	{
		authToken = undefined;
		username = '';
    company = '';
    isAdmin = false;
		isAuthenticated = false;
    _id = null;
    //Remove the token from the header for future requests
		$http.defaults.headers.common['x-access-token'] = authToken;
    //Delete the token (username and actual token) from local storage
		$localStorage.remove(TOKEN_KEY);
	}


    //Login function which is called from our login form. We expect a .username and .password
    authFac.Login = function(loginData) {
        //Call the server (authRouter) for a new login request
        $resource(baseURL + "auth/login")
        .save(loginData,
           function(response) {
                  //console.log("Successful login, here is the response:");
                  //console.log(response);
                  //console.log(response.token);
              //We successfully logged in according to the server.
              //Lets save the token along with our login name (email) into local storage
              //Not sure why we need to keep the username, but ... there it is.
              //Server responds with a token which we also store
              StoreUserCredentials({username:loginData.username, token: response.token});
              //Call out to any listeners that we successfully logged in
              //such as the HeaderController, which then runs a function to:
              //get the user name (actual first and last, from AuthFac.GetUserName() below)
              //and set that the user is logged in (using AuthFac.IsAuthenticated())
              $rootScope.$broadcast('login:Successful');
           },
           function(response){
            //The login was a failure. Be sure to save that we are not authenticated yet, and provide an error response message
              isAuthenticated = false;
            
              var message = '\
                <div class="ngdialog-message">\
                <div><h3>Login Unsuccessful</h3></div>' +
                  '<div><p>' +  response.data.err.message + '</p><p>' +
                    response.data.err.name + '</p></div>' +
                '<div class="ngdialog-buttons">\
                    <button type="button" class="ngdialog-button ngdialog-button-primary" ng-click=confirm("OK")>OK</button>\
                </div>'
            
                ngDialog.openConfirm({ template: message, plain: 'true'});
           }
        
        );

    };
    
    //This function tells the server we've logged out, and then cleans up our model (local variables) and client (local storage)
    authFac.Logout = function() {
        $resource(baseURL + "auth/logout").get(function(response){});
        DestroyUserCredentials();
        //I just added this in to test broadcasting, I don't think it's necessary
        $rootScope.$broadcast('logout:Successful');
    };
    
    //This function is called when a new user signs up; posts to the server and logs you in.
    //Note we need to encrypt the 'userinfo' (login name and password) before release.
    authFac.Register = function(registerData) {
        //Tell the server we have a new user...
        $resource(baseURL + "auth/register")
        .save(registerData,
           function(response) {
            //Once the server comes back with a successful new user registration, we want to log in as that user
              authFac.Login({username:registerData.username, password:registerData.password});
            //If user clicked "Remember Me" we want to save that into local storage so we can easily renew token when expired
            //and keep the user always logged in and authenticated
            if (registerData.rememberMe) {
                $localStorage.storeObject('userinfo', {username:registerData.username, password:registerData.password});
            }
            
            //Call out a successfull registration to all listeners...
            //in this case the HeaderController which actually does the same exact @#$! as broadcast login:Successful 
            // ..... it just gets username and isAuthenticated .... K.
            $rootScope.$broadcast('registration:Successful');
           },
           function(response){
            //If something went wrong when trying to register, let's flash a warning message
              var message = '\
                <div class="ngdialog-message">\
                <div><h3>Registration Unsuccessful</h3></div>' +
                  '<div><p>' +  response.data.err.message + 
                  '</p><p>' + response.data.err.name + '</p></div>';

                ngDialog.openConfirm({ template: message, plain: 'true'});

           }
        
        );
    };
    
    //This will extract the payload from our JWT token.
    //Not sure why this needs to be a public service function???
    authFac.ParseJwt = function() {
        var base64Url = authToken.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse($window.atob(base64));
    };


    authFac.IsAuthenticated = function() {
        return isAuthenticated;
    };

    authFac.IsAdmin = function(){
        return isAdmin;
    };
    
    authFac.GetUsername = function() {
        return username;  
    };

    authFac.GetCompany = function() {
        return company;  
    };

    authFac.GetUserData = function()
    {
      //console.log("AuthFactory.GetUserData: isAuthenticated = " + isAuthenticated.toString());
      if(isAuthenticated)
      {
        //LoadUserCredentials(); //make sure this gets called before we try to get all the info?
        var user = {};
        user.isAuthenticated = isAuthenticated;
        user.isAdmin = isAdmin;
        user.username = username;
        user.authToken = authToken;
        user._id = _id;
        user.company = company;
        //console.log("Here is the user data we are returning:");
        //console.log(user);
        return user;
      }
      else
        return null;
    };

    LoadUserCredentials();
    
    return authFac;
}])
;