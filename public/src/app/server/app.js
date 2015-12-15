/**
 * Application Main Module
 * Name: nearbyTweetsApp
 */
var app = angular.module('nearbyTweetsApp', 
    [
        'ngRoute',
        'ngSanitize',   
        'infinite-scroll',
        'nearbyTweetsApp.services'
    ]);