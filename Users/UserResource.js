'use strict';
var dataResource = angular.module('dataResource');

dataResource.factory('UserResource', ['$resource', function ($resource) {

    return $resource(dataResource.baseUrl + '/api/User', {}, {
        getList: { method: 'GET', isArray: true },
        getByEmail: { method: 'GET', params: { email: '' }, isArray: true, url: dataResource.baseUrl + "/api/User?$filter=Email eq '" + ':email' + "'" },
        sendNewUserEmail: { method: 'GET', params: { userId: '', roleId: '' }, isArray: false, url: dataResource.baseUrl + '/api/User/SendNewUserEmail?userId=:userId&roleId=:roleId' },
        query: { method: 'GET', params: { userId: '', include: '' }, isArray: false },
        getCurrentUser: { method: 'GET', params: { include: '' },url: dataResource.baseUrl + '/api/User/GetCurrentUser', isArray: false },
        save: { method: 'POST' },
        update: { method: 'PUT' },

        enableDisableUser: { method: 'GET', params: { userId: '', action: '' }, url: dataResource.baseUrl + '/api/User/EnableDisable', isArray: false },


       // getCurrentUser: { url: dataResource.baseUrl + '/api/User?include=:include', params: { 'include': '' }, method: 'GET', isArray: false },
        getRegistrationUser: { method: 'GET', params: { id: '', token: '' }, isArray: false, url: dataResource.baseUrl + '/api/User/GetRegistrationUser' },
        registerUser: { method: 'PUT', params: { id: '', token: '' }, url: dataResource.baseUrl + '/api/User/RegisterUser' }
           
    });

}]);