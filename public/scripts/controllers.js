//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  All controller code for our angular application.
  //  These handle the models (variables/data) that interact with our views
  //
  //  DetailControl       (jobDetail)
  //  NewJobControl       (newJob)
  //  HeaderControl       (header)
  //  LoginControl        (header)
  //  RegisterControl     (register)
  //  TestControl         (test)
  //
  //  Notes: ►
  //    
  //  Todo:
  //    -Everything....
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘

angular.module('anguApp')
.controller('BodyControl', ['$scope', '$state', function($scope, $state) {
    // Allows us to set a background image based on which $state we are in.
    // For now, we are only showing a background image on the Welcome page.
    $scope.getBackground = function() {
      if ($state.current.name === 'app') {
        return 'images/sup.jpg';
      } 
      else {
        return '';
      }
    }
}])

.controller('DetailControl', ["$scope", "$stateParams", "apexFactory", function(sc, $stateParams, apexFactory) {
  //console.log("Loading page for DB entry # ", $stateParams._id);
  sc.type = "Loading";
  sc.details;


  sc.LogDetails = function(_id)
  {
    _id = $stateParams._id;
    if(!_id) 
    { 
      //We somehow got here without an _id, the user should just be re-directed to the homepage [?]
      console.log("No ID provided to search with.");

    }
    else
    {

      apexFactory.GetDetails().query({_id:_id}).$promise.then(
        function(response) 
        { 
          // Response returns an array of data
          //response[0] = {type: "User"} or "Job" or "Company"
          //response[1] = Object data

          //So this is kinda interesting. My server is responding with JSON:
            //res.json(data) .. an array of JSON to be specific
            //Anywho, that appears to be automatically parsed into a Javascript object
            //Evident by the code below, showing I can grab a properties value 
            //without having to first parse my response

          // console.log("response[0] RAW: ", response[0]);
          // console.log("response[0].type: ", response[0].type);
          // console.log("response[1] RAW: ", response[1]);
          // console.log("response[1]._id: ", response[1]._id);

          sc.type = response[0].type;

          if(sc.type == "Failed")
          {
            console.log("Database search returned no results.");
            //
          }
          else
          {
            sc.details = response[1];
          }

        },
        function(response) { console.log("The database call was unsuccessful: ", response.status + " " + response.statusText); }
      );
    }
  }

  sc.LogDetails($stateParams._id);
}])

.controller('NewJobControl', ['$scope', 'AuthFactory', 'apexFactory', function(sc, AuthFactory, apexFactory){
  console.log("loaded new job controller");
  //This variable is our model.
  //We can actually add new fields/properties to this object from within the angular HTML code
  //Not everything has to be defined here :0
  sc.newjob = [{}];

  //newjob[0] is for company info. Two options here: 
  //  1) an ID number because you selected an existing company. newjob[0].company = mongo ID
  //  2) complete new company data (you did a quickAdd as an admin) newjob[0] = {name:"united", address:"myhouse"} etc.
  sc.newjob[0] = {}; 
  sc.newjob[1] = {name:"", lot:"", floorplan:""};
 
  //If the user is an Admin, we will add an input field to select which company the new job belongs to
  //otherwise
  sc.isAdmin = AuthFactory.IsAdmin();
  if(!sc.isAdmin)
  {
    sc.newjob[0].company = AuthFactory.GetCompany();
  }
  else
  {
    //We're an admin, so let's get all the possible companies we can assign this job to

    //This variable holds the names and IDs of the companies we can assign this job to
    sc.companyNames = {}; 

    apexFactory.GetCompanies().query(
      {_id:"names"},
      function(response) 
      { 
        sc.companyNames = response;
        //Add an option to add a new company on the fly here
        //sc.companyNames[sc.companyNames.length] = {_id: "Add new", name:"Add new"};
        console.log(sc.companyNames);
      },
      function(response) { sc.message = "Error loading Companies: " + response.status + " " + response.statusText; sc.companiesLoaded = -1; });
  }

  sc.SubmitNewJob = function() {
    //If we selected an existing company, we want to share that ID with the newjob object
    if(sc.newjob[0].company)
      sc.newjob[1].company = sc.newjob[0].company;
    console.log("Submitting job data: ", sc.newjob[1]);
    apexFactory.GetJobs().Save(sc.newjob, 
      function(response){
        alert("Successfully submit new job, yay");},
      function(response){
        alert("Error loading Companies: " + response.status + " " + response.statusText);
    });
  };
}])

.controller('HeaderControl', ['$scope', '$localStorage', '$state', '$rootScope', 'ngDialog', 'AuthFactory', '$window', function ($scope, $localStorage, $state, $rootScope, ngDialog, AuthFactory, $window) {
  //there is some code duplication between HeaderControl and LoginControl, and I think that's okay.
  //Essentially you can log in/out from two seperate locations; and we want to make sure they both work
  //and affect each other when used. Logging in from one location needs to let the other lcoation know
  //the option is now to log out and vice versa.

  //I cannot imagine the header control actually needs all this information, but it's everything we can grab from the authfactory
  $scope.user = {};
  $scope.user.loggedIn = false;
  $scope.user.isAuthenticated = false;
  //$scope.user.isAdmin = false;
  $scope.user.username = '';
  //$scope.user.authToken = null;
  //$scope.user._id = null;
  $scope.loginData = $localStorage.getObject('userinfo','{}');

  if(AuthFactory.IsAuthenticated())
  {
    $scope.user.loggedIn = true;
    $scope.user.username = AuthFactory.GetUsername();
  }

  $scope.OpenLogin = function() { 
    ngDialog.open({ template: 'views/login.html', scope: $scope, className: 'ngdialog-theme-default'}); };

  $scope.doLogin = function() {
    if($scope.rememberMe)
       $localStorage.storeObject('userinfo',$scope.loginData);

    AuthFactory.Login($scope.loginData);
    ngDialog.close();

  };

  $scope.LogOut = function() 
  {
      AuthFactory.Logout();
      $scope.user.loggedIn = false;
      $scope.user.username = '';
      $window.location.href = '/#';
  };

  $scope.StateIs = function(currentState) { return $state.is(currentState); };


  //Event handler/listener for a rootScope BROADCAST
  $rootScope.$on('login:Successful', function() {
    console.log("header control login success, resetting tokenChecked to false");
    $scope.user.loggedIn = true;
    $scope.user.username = AuthFactory.GetUsername();
    
    //We just got a new token, so reset the bool that says the expired token has been alerted
    $rootScope.tokenChecked = false;  
  });

  $rootScope.$on('registration:Successful', function() {
    $scope.user.loggedIn = AuthFactory.IsAuthenticated();
    $scope.user.username = AuthFactory.GetUsername();
  });

  $rootScope.$on('logout:Successful', function() {
    $scope.user.loggedIn = false;
    $scope.user.username = '';
  });

  $rootScope.$on('token:Expired', function() {
    //Our token has expired, we can no longer access the server (where auth is required)
    //So lets see if we either have userinfo saved in local storage and re-login
    //or if not, just log out
    //For now, we are just going to log you out, sorry.
    alert("Your login has expired; please relog to proceed.");
    console.log("We caught broadcast 'token:Expired' in headerControl!, groovy. You will now be logged out!");
    $scope.LogOut();
  });
}])

.controller('LoginControl', ['$scope', '$rootScope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, $rootScope, ngDialog, $localStorage, AuthFactory) {
    //there is some code duplication between HeaderControl and LoginControl, and I think that's okay.
    //Essentially you can log in/out from two seperate locations; and we want to make sure they both work
    //and affect each other when used. Logging in from one location needs to let the other lcoation know
    //the option is now to log out and vice versa.


    //this should be encrypted [we would decrypt here]
    $scope.loginData = $localStorage.getObject('userinfo','{}');

    $scope.user = {};
    $scope.user.loggedIn = false;


    if(AuthFactory.IsAuthenticated())
    {
      $scope.user.loggedIn = true;
    }

    $scope.OpenLogin = function() { 
      ngDialog.open({ template: 'views/login.html', scope: $scope, className: 'ngdialog-theme-default'}); 
    };


    $scope.doLogin = function() {
        if($scope.rememberMe)
           $localStorage.storeObject('userinfo',$scope.loginData);

        AuthFactory.Login($scope.loginData);

        ngDialog.close();

    };
            
    $scope.openRegister = function () {
        ngDialog.open({ template: 'views/register.html', scope: $scope, className: 'ngdialog-theme-default', controller:"RegisterController" });
    };

    $scope.LogOut = function() 
    {
      AuthFactory.Logout();
      $scope.user.loggedIn = false;
      $scope.user.username = '';
    };

  

    $rootScope.$on('login:Successful', function() {
      console.log("login control login success, resetting tokenChecked to false");

      $scope.user.loggedIn = true;
      $scope.user.username = AuthFactory.GetUsername();
      //We just got a new token, so reset the bool that says the expired token has been alerted
    $rootScope.tokenChecked = false;  
    });
    $rootScope.$on('logout:Successful', function() {
      $scope.user.loggedIn = false;
      $scope.user.username = '';
    });
}])

.controller('RegisterController', ['$scope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, ngDialog, $localStorage, AuthFactory) {
    
    $scope.register={};
    $scope.loginData={};
    
    $scope.DoRegister = function() {
        console.log('Doing registration', $scope.registration);

        AuthFactory.Register($scope.registration);
        
        ngDialog.close();

    };
}])

.controller('TestControl', ['$scope', '$localStorage', "apexFactory", function(sc, $localStorage, apexFactory){
  console.log("loaded test controller");
  sc.notes = [];
   apexFactory.GetTestData().query().$promise.then(
    function(response) { sc.notes = response; 
      //console.log(response);
      //console.log(sc.notes[0].body);
      //console.log(sc.notes[1].body);


    },
    function(response) { alert("Error loading Users: " + response.status + " " + response.statusText); });
}])

.controller('RequestController', ['$scope', 'apexFactory', 'AuthFactory', '$localStorage', function(sc, apexFactory, AuthFactory, $localStorage) {
  console.log("REQUESTCONTROLLER LOADED");
  
  //Model for the inquiry/request data we'll fill in and submit
  sc.request = {
    company: "",
    name: "",
    email: "",
    comment: ""
  }

  sc.userdata = AuthFactory.GetUserData();
  console.log("Here is the sc.userdata  from AuthFactory.GetUserData");
  console.log(sc.userdata);
  if(sc.userdata)
  {
    console.log("Hey we are real people");
    sc.loggedIn = true;
    sc.username = sc.userdata.username;

    var myDetails = {};

    apexFactory.GetUsers().get({_id: sc.userdata._id},{notifications:0}).$promise.then(
      function(response) {
        myDetails = response; 
        console.log('User details: ', myDetails);

        if(myDetails.company)sc.request.company = myDetails.company.name; //Awesome. When I get user, I populate the company with just the name (and ofc we get the ID)
        else sc.request.company = "Not set";
        sc.request.name = myDetails.firstname + ' ' + myDetails.lastname;
        sc.request.email = myDetails.username;
      },
      function(response) {
        console.log("Error getting your data, must not be logged in?:");
        console.log(response);
      }
    );
  }

  sc.postRequest = function() {
    console.log('Submitted request: ', sc.request);
    alert(JSON.stringify(sc.request, undefined, 2));
  }

  function init_map() {

    console.log('Creating Google Map.');
    var location = new google.maps.LatLng(48, 12); // Pac West latitude/longitude.

    var mapoptions = {
      center: location,
      zoom: 16,
      scrollwheel: false,
      draggable: false,
      mapTypeId:google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById('googleMap'), mapoptions);

    var marker = new google.maps.Marker({
      position: location
    });

    marker.setMap(map);
  }
  
  //init_map();
}]);