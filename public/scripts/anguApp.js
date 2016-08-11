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
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('app', {
      url: '/', 
      views: {
        'header': {templateUrl: 'views/header.html', controller: 'HeaderControl'},
        'content': {template: '<p>welcome to /</p>'/*, controller: 'IndexControl'*/},
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
        {'content@': {templateUrl: 'views/test.html'/*, controller: 'NewJobControl'*/}}
    })
    .state('app.detail', {
      url:'detail/:_id',
      views: 
        {'content@': {templateUrl: 'views/detail.html'}}
    });

    $urlRouterProvider.otherwise('/');
  })
;