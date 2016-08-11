//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Factories and services for interacting with our backend.
  //
  //  apexFactory 
  //    ► Resource(HTTP) calls to the server
  //    ► Handles jobs/users/notifications/companies
  //
  //  localStorage
  //    ► Handles our local storage keys/values (login credentials)
  //
  //  AuthFactory
  //    ► Processes logging in/out, registering, and saving/loading credentials ("remember me?")
  //
  //  Notes:
  //
  //  Todo:
  //    -Have AuthFactory keep track of admin status...???
  //    -AuthFactory needs to encrypt your credentials prior to localstorage save ("remember me?")
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
console.log("services.js loaded ok thanks");
angular.module('anguApp')
.constant("baseURL", "https://localhost:3443/")
//To use factories or services....?
//To have one master factory for all data
//or to have jobFac, userFac, companyFac, etc
.factory('apexFactory', ['$resource', 'baseURL', function($resource, baseURL)
{
	console.log('apex factory made');
	var apexFac = {};


  apexFac.GetUnclaimedUsers = function()
  {
    return $resource(baseURL + "users/unclaimed", null, null);
  }
  apexFac.GetNotifications = function()
  {
    //Returns an array of notifications
    //If there are none, we get:
      //response[0] = {count: 0}
      //response[1] = {type: "Success"}
    return $resource(baseURL + "users/notifications", null, {'Delete':{method:'DELETE'}});
  }
	apexFac.GetUsers = function()
	{
		return $resource(baseURL + "users/:_id", null, {'Update':{method:'PUT'}});
	}

  apexFac.GetDetails = function()
  {
    return $resource(baseURL + "data/details/:_id", null, {'Update':{method:'PUT'}});
  }

	apexFac.GetJobs = function()
	{
		return $resource(baseURL + "jobs/:_id", null, {'Update':{method:'PUT'}});
	}

	apexFac.GetCompanies = function()
	{
		return $resource(baseURL + "companies/:_id", null, {'Update':{method:'PUT'}});
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

	var authFac = {};
	var TOKEN_KEY = 'Token';
	var isAuthenticated = false;
  var isAdmin = false;
	var username = '';
	var authToken = undefined;

	function LoadUserCredentials()
	{
		var credentials = $localStorage.getObject(TOKEN_KEY, '{}');
		if(credentials.username != undefined)
    {
			UseCredentials(credentials);
    }
	}

	function StoreUserCredentials(credentials)
	{
		$localStorage.storeObject(TOKEN_KEY, credentials);
		UseCredentials(credentials);
	}

	function UseCredentials(credentials) 
	{
		isAuthenticated = true;
    isAdmin = credentials.admin;
		username = credentials.username;
		authToken = credentials.token;

		//Set the token as header for our requests
		$http.defaults.headers.common['x-access-token'] = authToken;
	}

	function DestroyUserCredentials()
	{
		authToken = undefined;
		username = '';
    isAdmin = false;
		isAuthenticated = false;
		$http.defaults.headers.common['x-access-token'] = authToken;
		$localStorage.remove(TOKEN_KEY);
	}

    authFac.Login = function(loginData) {
        
        $resource(baseURL + "auth/login")
        .save(loginData,
           function(response) {
              //console.log("Successful log, here is the response:");
              //console.log(response);
              //console.log(response.token);
              StoreUserCredentials({username:loginData.username, token: response.token});
              $rootScope.$broadcast('login:Successful');
           },
           function(response){
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
    
    authFac.Logout = function() {
        $resource(baseURL + "auth/logout").get(function(response){});
        DestroyUserCredentials();
    };
    
    authFac.Register = function(registerData) {
        
        $resource(baseURL + "auth/register")
        .save(registerData,
           function(response) {
              authFac.Login({username:registerData.username, password:registerData.password});
            if (registerData.rememberMe) {
                $localStorage.storeObject('userinfo',
                    {username:registerData.username, password:registerData.password});
            }
           
              $rootScope.$broadcast('registration:Successful');
           },
           function(response){
            
              var message = '\
                <div class="ngdialog-message">\
                <div><h3>Registration Unsuccessful</h3></div>' +
                  '<div><p>' +  response.data.err.message + 
                  '</p><p>' + response.data.err.name + '</p></div>';

                ngDialog.openConfirm({ template: message, plain: 'true'});

           }
        
        );
    };
    
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

    LoadUserCredentials();
    
    return authFac;
}])
;