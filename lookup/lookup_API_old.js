
'use strict';
var dataResource = angular.module('dataResource');
dataResource.factory('lookupResourceOld', ['$resource', function ($resource) {
    return $resource(dataResource.baseUrl + '/api/Lookup', {}, {
        getLookup:{method: 'GET', isArray:true} //takes param lookup
    });
}])

.factory('lookupAPIOld', ['lookupResourceOld', function(lookupResource){
    return{
      getLookup: lookupResource.getLookup,
      getLookupPromises: function(lookups){
        var obj ={}, array=[]
        for(var i =0; i<lookups.length; i++){
          var promise = lookupResource.getLookup({lookup: lookups[i]}).$promise;
          array.push(promise);
          obj[lookups[i]] = {promise: promise, index: array.length-1};
        }
        return {lookupObject: obj, promiseArray:array}
      }
    }
 }]);