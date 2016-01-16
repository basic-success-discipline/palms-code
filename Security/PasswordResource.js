'use strict';
var dataResource = angular.module('dataResource');

dataResource.factory('PasswordResource', ['$resource', function ($resource) {

    return $resource(dataResource.baseUrl + '/api/PasswordReset', {}, {
        passwordReset: { method: 'GET', params: { userId: '', token: '' }, isArray: false },
        passwordResetRequest: { method: 'POST', params: { userEmail: '' }, isArray: false },
        changePassword: { method: 'POST' },
    });
}]);


