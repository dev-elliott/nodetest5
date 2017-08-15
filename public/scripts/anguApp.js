//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Entry point for our angular application.
  //  We configure the ui-routes here, and have a state for each page
  //
  //  Notes:
  //  Using "content@" for our views replaces only the content and retains the header and footer code 
  //  from its parent (which is 'app'), since we are nesting our states as: app.dashboard etc
  //  Also, we are able to pass a controller in from here, however it initalizes it when we do that
  //  since i'm already passing (and init'ing) elsewhere, i dont need to repeat that here
  //
  //  Todo:
  //  Create a nested state for each dashboard/ 'tab' so I can load one controller at a time
  //  instead of all controllers at once? Potential issue of then re-loading the controller
  //  every time we change tabs?
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
'use strict';
console.log("anguApp.js loaded ok thanks");
angular.module('anguApp', ["ngMaterial", "xeditable", "ui.router", "ngResource", 'ngDialog', 'ngAnimate', 'ngSanitize'])
  .run(function(editableOptions) { editableOptions.theme = 'bs3'; } )
  .config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $stateProvider

    .state('app', {
      url: '/', 
      views: {
        'header': {templateUrl: 'views/header.html', controller: 'HeaderControl'},
        'content': {templateUrl: 'views/welcome.html', controller: 'LoginControl'},
        'footer': {templateUrl: 'views/footer.html'}
      }})

    .state('app.dashboard', {
      url:'dashboard',
      views: 
        {'content@': {templateUrl: 'views/dashboard.html'/*, controller: 'DataControl'*/}}
    })

    .state('app.newjob', {
      url:'newjob',
      views: 
        {'content@': {templateUrl: 'views/newjob.html'/*, controller: 'NewJobControl'*/}}
    })
    .state('app.test', {
      url:'test',
      views: 
        {'content@': {templateUrl: 'views/test.html'/*, controller: 'TestControl'*/}}
    })
    .state('app.detail', {
      url:'detail/:_id',
      views: 
        {'content@': {templateUrl: 'views/detail.html'}}
    })
    .state('app.contactus', {
      url: 'contact',
      views: 
        {'content@': {templateUrl: 'views/contactus.html', controller: 'RequestController'}}
    });

    $urlRouterProvider.otherwise('/');
    //We want to intercept a server response saying our jwt credentials have expired and have the user relogin.
    $httpProvider.interceptors.push(['$q', '$location', '$localStorage', '$rootScope', function($q, $location, $localStorage, $rootScope) {
      var count = 0;
      return {
          'request': function (config) {
              //alert("We are intercepting a request cool");
              return config;
          },
          'responseError': function(response) {
            console.log("intercepting a respnose..", response);
              if(response.data.message == ("tokenexpired")) {
                  $rootScope.$broadcast('token:Expired'); 
                  count++;
                  console.log("We have caught it this many times...", count);
              }
              return $q.reject(response);
          }
      };
   }]);
})
;