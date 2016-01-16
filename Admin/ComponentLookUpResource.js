'use strict';
var dataResource = angular.module('dataResource');

dataResource.factory('ComponentLookUpResource', ['$resource', function ($resource) {
    var api = dataResource.baseUrl + '/api/ComponentLookUp';
    return $resource(api, {}, {
        getAll: { method: 'GET', isArray: true, url: api + '/GetAll' },
        getByCategory: { method: 'GET', params: { categoryName: '' }, isArray: true, url: api+ '/GetByCategory' },
        getByName: { method: 'GET', params: { categoryName: '', componentName: '' }, url: api + '/GetByNameAndCategory', isArray: false },
        create: { method: 'POST' },
        update: { method: 'PUT' },
        remove: { method: 'DELETE', params: { id: '' }, isArray: false }

    });
}]);