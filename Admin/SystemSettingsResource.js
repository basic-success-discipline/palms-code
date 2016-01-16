'use strict';
var dataResource = angular.module('dataResource');

dataResource.factory('SystemSettingsResource', ['$resource', function ($resource) {

    return $resource(dataResource.baseUrl + '/api/SystemSetting', {}, {
        getPublicList: { method: 'GET', params: { id: '' }, isArray: true },
       
    });
}]);