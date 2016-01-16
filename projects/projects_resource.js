
'use strict';
var dataResource = angular.module('dataResource');
dataResource.factory('projectsResource', ['$resource', function ($resource) {

  var include = [ 
    'discharges'
    , 'projectImprovements'
    , 'nimsCategories'
    , 'nimsObjectives'
    , 'federalgrantassignments'
    , 'borrower'
    , 'agreement'
    , 'dwsrfbenefits'
    , 'greenprojectreserves'
    , 'cwsrfbenefits'
    ];


  return $resource(dataResource.baseUrl + '/api/Project', {}, {
    getAll:{method: 'GET', isArray:true},
    getByProjectId: { method: 'GET', params: {include: include.join()}, isArray: false}, //takes param projectId
    remove: { method: 'DELETE' },//takes param projectId
    save: { method: 'POST' },
    update: { method: 'PUT' }
  });
}])


// .factory('projectsAPI', ['projectsResource', 'projectsStandardData', function(projectsResource, projectsStandardData){
//   return{
//     getAll: projectsResource.getAll,
//     getByProjectId: function(params, callback, errorCallBack){
//       projectsResource.getByProjectId(params).$promise
//         .then(function(results){
//           return projectsStandardData.getByProjectId(results);
//         })
//         .then(function(results){
//           callback(results);
//         });
//     },
//     remove: projectsResource.remove,
//     save: projectsResource.save,
//     update: projectsResource.update
//   }

// }])

// .factory('projectsStandardData', ['$q', '$http', 'lookupAPI', function($q, $http, lookupAPI){
//   return{

//     getByProjectId: function(data){
//       var meta, lookups;
//       //get project metadata
//      return $http.get('/projects/project_metadata.json').then(function(results){

//         meta = results.data;

//         //get list of enumerated fields that need lookups (use name of backend variable if needed)
//         var toBeLookedUp = [];
//         for(var key in meta){
//           if (meta.hasOwnProperty(key)){
//             if(meta[key].type && meta[key].type==="select"){
//               if(!(meta[key].custom && meta[key].custom.lookup)){
//                 toBeLookedUp.push(meta[key].backend || key);
//               }
//             }
//           }
//         }

//         //handle custom lookups --NEED TO IMPLEMENT BACKEND || PATTERN
//         if('compliance_status' in meta){
//           toBeLookedUp.push('cw_compliance_status');
//           toBeLookedUp.push('dw_compliance_status');
//           toBeLookedUp.push('compliance_status');
//         }

//         if('affected_waterbodies' in meta){
//           toBeLookedUp.push('waterbody_id');
//         }

//         if('designated_water_uses' in meta || 'other_water_uses' in meta){
//           toBeLookedUp.push('protection');
//           toBeLookedUp.push('restoration');
//         }
//         if('designated_water_uses' in meta){
//           toBeLookedUp.push('designated_water_use');
//         }
//         if('other_water_uses' in meta){
//           toBeLookedUp.push('other_water_use');
//         }

//         if('federal_grant_assignments' in meta){
//           toBeLookedUp.push('grant_year');
//         }


//         //get normal look up promises for concurrent request
//         var temp = lookupAPI.getLookupPromises(toBeLookedUp);

//         lookups = temp.lookupObject;
//         var promises = temp.promiseArray;



//         //call all requests concurrently
//         return $q.all(promises);

//       }).then(function(lookupData){

//           //inject request responses into appropriate enumerated fields
//           var standardData = {};
//           for(var key in meta){
//             if (meta.hasOwnProperty(key)){
//               if(meta[key].type && meta[key].type==="select"){
//                 if(!(meta[key].custom && meta[key].custom.lookup)){
//                   meta[key].options=lookupData[meta[key].backend ? lookups[meta[key].backend].index : lookups[key].index];
//                 }
//               }


//               //combine data with meta data (use frontend name if defined in project_metadata.json)
//               if(meta[key].frontend && !meta[key].backend){
//                 meta[key].backend = key;
//               }
//               standardData[meta[key].frontend||key] = {data: data[meta[key].backend || key], meta: meta[key]};
              
//             }
//           }

//           //handle custom lookups
//         if('compliance_status' in meta){
//           if(standardData['funding_program'].data == "CWSRF"){
//             meta['compliance_status'].options = lookupData[lookups['cw_compliance_status'].index];
//           }else if(standardData['funding_program'].data == "DWSRF"){
//              meta['compliance_status'].options = lookupData[lookups['dw_compliance_status'].index];
//           }else{
//             meta['compliance_status'].options = lookupData[lookups['compliance_status'].index];
//           }
//           standardData['compliance_status'] = {data: data['compliance_status'], meta: meta['compliance_status']}
//         }

//         if('affected_waterbodies' in meta){
//           meta['affected_waterbodies'].columns['waterbody_id'].options = lookupData[lookups['waterbody_id'].index];
//           standardData['affected_waterbodies'] = {data: data['affected_waterbodies'], meta: meta['affected_waterbodies']}
//         }

//         if('designated_water_uses' in meta){
//           meta['designated_water_uses'].columns['designated_water_use'].options = lookupData[lookups['designated_water_use'].index];
//           meta['designated_water_uses'].columns['protection'].options = lookupData[lookups['protection'].index];
//           meta['designated_water_uses'].columns['restoration'].options = lookupData[lookups['restoration'].index];
//         }

//         if('other_water_uses' in meta){
//           meta['other_water_uses'].columns['other_water_use'].options = lookupData[lookups['other_water_use'].index];
//           meta['other_water_uses'].columns['protection'].options = lookupData[lookups['protection'].index];
//           meta['other_water_uses'].columns['restoration'].options = lookupData[lookups['restoration'].index];
//         }

//         if('federal_grant_assignments' in meta){
//           meta['federal_grant_assignments'].columns['grant_year'].options = lookupData[lookups['grant_year'].index];
//         }

//           //return data
//           return standardData;
//         });

//       }

// }
// }])
;
