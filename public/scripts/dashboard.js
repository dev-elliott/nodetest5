angular.module('anguApp')
.controller('CompanyControl', ["$scope", "$stateParams", "apexFactory", "AuthFactory", "ngDialog", function(sc, $stateParams, apexFactory, AuthFactory, ngDialog) {
  //
  // ================ INITIAL SETUP =============================================================
  //
  sc.companies = [{}];
  sc.isAdmin = AuthFactory.IsAdmin();
  if(!sc.isAdmin)
  {
    //User is not an admin, so let's just stop right here!
    return;
  }
  //Error handling
  //0=Loading, 1=Success, -1=Failed
  sc.companiesLoaded = 0;
  sc.message = "Loading companies...";

  //untested
  sc.GetOpenJobsCount = function(company)
  {
    if(!company.jobs || company.jobs.length < 1)
      return 0;

    var count = 0;
    for(var i = 0; i < company.jobs.length; i++)
      if(company.jobs[i].status != "Cancelled" && company.jobs[i].status != "Complete")
        count++;

    return count;
  }
  apexFactory.GetCompanies().query(
    function(response) { sc.companies = response; sc.companiesLoaded = 1;},
    function(response) { sc.message = "Error loading Companies: " + response.status + " " + response.statusText; sc.companiesLoaded = -1; });

  //
  // ================ CREATE NEW, EDIT, DELETE =============================================================
  //
  sc.companyData = {}; //This is from user input for a new company
  sc.createNewCompany = function()
  {
    ngDialog.open({ template: 'views/newcompany.html', scope: sc, className: 'ngdialog-theme-default'}); 
  };
  sc.saveNewCompany = function()
  {
    apexFactory.GetCompanies().save(sc.companyData, function(response)
    {
      alert("save success,  id (response): " + response);
      console.log("save success,  id (response): " + response);
      //We successfully added the company to the database, let's reflect that clientside (add it to table)
      sc.companies.push(sc.companyData); 
      sc.companyData = {};
      ngDialog.close();
    },
    function(response)
    {
      console.log("Failed response saving new company: ", response);
      alert("An error occured and your new company wasn't saved");
    });
  };


  sc.UpdateCompany = function(data, _id)
  {
    apexFactory.GetCompanies().Update({_id:_id}, data);
  };


  sc.companyToDelete = null; //Reference (id) to the company we clicked delete button for
  sc.PromptDeleteCompany = function(_id)
  {
    sc.companyToDelete = _id;
    ngDialog.open({ template: 'views/confirmDeleteCompany.html', scope: sc, className: 'ngdialog-theme-default'}); 
  };
  sc.DeleteCompany = function()
  {
    if(sc.companyToDelete != null) //Just make sure we got an id before proceeding
    {
      apexFactory.GetCompanies().delete({_id:sc.companyToDelete}, function(response) 
        { 
          //We removed a company with _id from the database successfully.
          //Now to remove that row from the table...match it based on _id I guess
          var count = 0;
          for(var i = 0; i < sc.companies.length; i++)
            if(sc.companies[i]._id == sc.companyToDelete)
            {
              sc.companies.splice(i, 1); //Surgically remove this single element
              sc.companyToDelete = null;
              ngDialog.close();
              return;
            }
        },
      function(response) { console.log("Failed to delete company: ", response); alert("An error occured and the company wasn't deleted"); });
    }
  };
}])

.controller('UserControl', ["$scope", "$stateParams", "apexFactory", "AuthFactory", function(sc, $stateParams, apexFactory, AuthFactory) {
  sc.isAdmin = AuthFactory.IsAdmin();
  if(!sc.isAdmin)
  {
    //User is not an admin, so let's just stop right here!
    return;
  }
  sc.users = []; //Main variable array holding all the users we load from the database
  sc.companyNames = {}; //This variable holds the names and IDs of the companies so we can assign new users to a company
  //Error handling
  //0=Loading, 1=Success, -1=Failed
  sc.usersLoaded = 0;
  sc.message = "Loading users...";

  //Since I don't know how to pass the database query parameters (companies.find({}, {name:1})
  //I am using a silly trick where I pass it a specific _id param ("names") which will return just the names of all companies
   apexFactory.GetCompanies().query(
    {_id:"names"},
    function(response) 
    { 
      sc.companyNames = response;
    },
    function(response) { sc.message = "Error loading Companies: " + response.status + " " + response.statusText; sc.companiesLoaded = -1; });


  sc.users = apexFactory.GetUsers().query(
    function(response) 
    { 
      sc.users = response; 


      sc.usersLoaded = 1;
    },
    function(response) 
    { 
      sc.message = "Error loading Users: " + response.status + " " + response.statusText; 
      sc.usersLoaded = -1; 
    });





  sc.ShowNames = function(user) 
  {
    if(user.company)
    {
      for(var i = 0; i < sc.companyNames.length; i++)
      {
        if(sc.companyNames[i]._id === user.company)
          return sc.companyNames[i].name;
      }
    }
    else
    {
      return "Not set";
    }
  };  



  sc.SaveUser = function(data, _id)
  {
    //put to server
    apexFactory.GetUsers().Update({_id:_id}, data, function(response)
    {
      //Our response from the server USER:ID PUT is the updated/saved/new user data.
      //Put that new data into the scope so the page shows the latest information, woo
      //no more page refresh needed!
      for(var i = 0; i < sc.users.length; i++)
      {
        if(sc.users[i]._id === _id)
          sc.users[i] = response;
      }
    },
    function(response)
    {
      //I should probably have a "toast" popup for when we fail on network calls.
      //I like the approach SoundCloud has.....
      // "something went wrong trying to save changes to user.....please try again"
      console.log("Failed response updating: ", response);
    });
  };
  sc.DeleteUser = function(_id)
  {
    console.log("Going to delete user with ID# ", _id);
  };
}])

.controller('JobControl', ["$scope", "$stateParams", "apexFactory", "ngDialog", function(sc, $stateParams, apexFactory, ngDialog) {
  sc.jobs = {};
  //Error handling
  //0=Loading, 1=Success, -1=Failed
  sc.jobsLoaded = 0;
  sc.message = "Loading...";
  sc.jobToDelete = null;

  sc.jobs = apexFactory.GetJobs().query(
     function(response) 
     { 
      //Okay, so we made a successful call to the database...however there are some different results we need to account for!
      
      //If there are no jobs to load, you'll just get a blank array.
      if(response.length == 0 || response[0].count == 0)
      {
        sc.message = "There are no jobs to display at this time."
        sc.jobsLoaded = -1;
        return;
      }
      //If the user is not yet linked to their company...
      if(response[0].result == "Failed")
      {
        sc.message = response[0].message;
        sc.jobsLoaded = -1;
        return;
      }
      //Otherwise, jobs successfully loaded, we good:
      sc.jobs = response;
      sc.jobsLoaded = 1;
      return;

    },
     function(response) { sc.message = "Error loading Jobs: " + response.result + " " + response.statusText; sc.jobsLoaded = -1});
  
  
  sc.LoadJob = function()
  {
    sc.jobs = apexFactory.GetJobs().get({_id:$stateParams._id})
      .$promise.then(
        function(response) { },
        function(response) { });
  }
  sc.UpdateJob = function(data, _id)
  {
    apexFactory.GetJobs().Update({_id:_id}, data);
  };
  sc.PromptDeleteJob = function(_id)
  {
    sc.jobToDelete = _id;
    ngDialog.open({ template: 'views/confirmDeleteJob.html', scope: sc, className: 'ngdialog-theme-default'}); 
  };
  sc.DeleteJob = function()
  {
    if(sc.jobToDelete != null) //Just make sure we got an id before proceeding
    {
      apexFactory.GetJobs().delete({_id:sc.jobToDelete}, function(response) 
        { 
          //We removed a company with _id from the database successfully.
          //Now to remove that row from the table...match it based on _id I guess
          var count = 0;
          for(var i = 0; i < sc.jobs.length; i++)
            if(sc.jobs[i]._id == sc.jobToDelete)
            {
              sc.jobs.splice(i, 1); //Surgically remove this single element
              sc.jobToDelete = null;
              ngDialog.close();
              return;
            }
        },
      function(response) { console.log("Failed to delete company: ", response); alert("An error occured and the company wasn't deleted"); });
    }
  };


  sc.statuses = ['Pending', 'Cancelled', 'Complete', 'Postponed', 'In-progress'];
  sc.ShowStatus = function(job) 
  {
    return (job.status);
  };  
}])

.controller('NotificationControl', ["$scope", "$stateParams", "apexFactory", "AuthFactory", function(sc, $stateParams, apexFactory, AuthFactory) {
  sc.isAdmin = AuthFactory.IsAdmin();
  sc.notifications = {};
  sc.unclaimedUsers = {};  
  //Error handling
  //0=Loading, 1=Success, -1=Failed
  sc.notificationsLoaded = 0;
  sc.message = "Loading...";


  apexFactory.GetNotifications().query(
     function(response) 
     { 
      //Expected response from query:
      //      JSON Array [ {count:0} , {result: Success} ]
      // OR   JSON Array with notification data.
      if(response[0].count == 0)
      {
        sc.notifications = {};
      }
      else 
        sc.notifications = response;

      //Whether we got notifications or none, we successfully loaded them from the server
      sc.notificationsLoaded = 1; 
     },
     function(response) { /*console.log("notify error: ", response);*/ sc.message = "Error loading notifications: " + response.status + " " + response.statusText; sc.notificationsLoaded = -1});
  
  //For admin only...
  if(sc.isAdmin)
  {
    apexFactory.GetUnclaimedUsers().query(
       function(response) { sc.unclaimedUsers = response; sc.notificationsLoaded = 1; },
       function(response) { sc.message = "Error loading unclaimed users: " + response.status + " " + response.statusText; sc.notificationsLoaded = -1});
  }

  sc.DeleteNotifications = function()
  {
    //Don't send the request to server if there aren't any notifications to delete
    if(sc.notifications.length > 0)
    {
      apexFactory.GetNotifications().Delete(
        function(response) { if(response.result == "Success") sc.notifications = {}; },
        function(response) { alert("FAILURE"); alert(JSON.stringify(response, undefined, 2)); });
    }
  };
}]);