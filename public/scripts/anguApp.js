'use strict';
console.log("anguApp.js loaded ok thanks");
angular.module('anguApp', ["ngMaterial", "xeditable", "ui.router", "ngResource", 'ngDialog', 'ngAnimate'])
  .run(function(editableOptions) { editableOptions.theme = 'bs3'; } )
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('app', { //route for the home page
      url: '/', 
      views: {
        'header': {templateUrl: 'views/header.html', controller: 'HeaderControl'},
        'content': {template: '<p>welcome to /</p>'/*, controller: 'IndexControl'*/},
        'footer': {templateUrl: 'views/footer.html'}
      }})

    .state('app.database', { //route for database page
      url:'database',
      views: 
        //Using "content@" replaces only the content and retains the header and f00ter 
        //from its parent which is app, since we are nesting this state as: app.database
        //We are able to pass a controller in from here, however it initalizes it when we do that
        //since i'm already passing (and init'ing) elsewhere, i dont need to repeat that here
        {'content@': {templateUrl: 'views/database.html'/*, controller: 'DataControl'*/}}
    })

    .state('app.newjob', { //route for newjob page
      url:'newjob',
      views: 
        {'content@': {templateUrl: 'views/newjob.html'/*, controller: 'NewJobControl'*/}}
    })
    .state('app.test', { //route for test page
      url:'test',
      views: 
        {'content@': {templateUrl: 'views/test.html'/*, controller: 'NewJobControl'*/}}
    })
    .state('app.detail', { //route for jobdetail page
      url:'detail/:_id',
      views: 
        {'content@': {templateUrl: 'views/detail.html'}}
    });
    $urlRouterProvider.otherwise('/');

  })
;