'use strict';
var dataResource = angular.module('dataResource');


dataResource.factory('AuthorizationResource', ['$resource', function ($resource) {

    return $resource(dataResource.baseUrl + '/api/Authorization', {}, {

    });
}]);