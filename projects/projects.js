'use strict';

angular.module('projects', ['ngResource'])

////////////////
// CONTROLLER //
////////////////

.controller('projectsCtrl', ['$scope', '$state', '$q', '$resource', 'baseUrl', 'lookupAPI', 'dataFormats', 'log', function($scope, $state, $q, $resource, baseUrl, lookupAPI, dataFormats, log) {
  

  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Projects List";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
      log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP



  ///////////////
  // LOAD DATA //
  ///////////////


  //get resources for page
  var include = [ 
  'recipient',
  'FundingProgram',
  'obligations'
  ];
  //define resources
  var resources = {
    projects: $resource(baseUrl + '/api/Project', {}, {
      getAll:{method: 'GET', params:{include:include.join()}, isArray:true}
    })
  }

  loadData();
  function loadData() {
    $scope.loading=true;

    var requests = [

    //get all projects
    resources.projects.getAll(function(results){
      $scope.projects = results;

      angular.forEach($scope.projects, function(item){
      item.obligatedAmount = 0;
      angular.forEach(item.obligations, function(ob){
        if(ob.typeOfObligationId == 395 || ob.typeOfObligationId == 396){
          item.obligatedAmount += ob.amount;
        }
        else if(ob.typeOfObligationId == 397){
          item.obligatedAmount -= ob.amount;
        }
      })
    });

      log.dir($scope.projects, 'projects');
    }).$promise
    ];


    // once all the requests are done
    $q.all(requests).then(function(data){ 
      $scope.loading=false;
    });
  }
  // END LOAD DATA



  /////////////////
  // GET LOOKUPS //
  /////////////////

  //enumerate lookups
  var lookups = [
    'recipient', 
    'assigned_staff',
    'funding_program', 
    'project_status',  
    'disbursement_status', 
    'admin_completion_status', 
    'repayment_status'
  ];

  //go get 'em'
  lookupAPI.doConcurrentLookups(lookups).then(function(data){
    $scope.lookups = data;
    
    log.dir($scope.lookups, 'lookups');
  });
  // END GET LOOKUPS


  ////////////////////////////
  // OPTION NAME FORMATTING //
  ////////////////////////////

  $scope.optionString = function(property, option){
    switch (property){
      case 'assignedStaff':
      return option.lastName + ', ' + option.firstName;
      break;
      default:
      console.error("Error in creating option string for: " + property);
    }
  }
  // END OPTION NAME FORMATTING


  ///////////////////////////////
  // READ-ONLY DATA FORMATTING //
  ///////////////////////////////
  $scope.money = function(decimalAmount){
    var money =  dataFormats['money'](decimalAmount);
    return money;
  }
  // END READ-ONLY FORMATTING



  ///////////////////////////
  // OPEN SELECTED PROJECT //
  ///////////////////////////

  $scope.openProject = function (projectId) {
    $state.go('project', { projectId: projectId });
  }
  // END OPEN SELECTED PROJECT




  //////////////////////
  // HELPER FUNCTIONS //
  //////////////////////


  $scope.resetFilters = function(){
    $scope.search = {};
    $scope.excludeFullyPaid = false;
    $scope.assignedStaff = null;
  }


  $scope.checkForNullSearchProperty = function(property){
    if($scope.search[property]==null){
      delete $scope.search[property];
    }
  }

 
 $scope.sortDescending=false;
  $scope.setSortOption = function(property){
    if($scope.sortOption == property){
      if(!$scope.sortDescending){
        $scope.sortDescending=true;
      }
      else{
        $scope.sortDescending=false;
        delete $scope.sortOption;
      }
    }else{
      $scope.sortOption = property;
      $scope.sortDescending=false;
    }
  }
  // END HELPER FUNCTIONS



}])
// END CONTROLLER



//filters 
.filter('excludeFullyPaidFilter', function(){
  return function (items, excludeFullyPaid){
    var filtered = [];
    if(excludeFullyPaid){
      angular.forEach(items, function(item){
        if(item.overallProjectStatusId != 142){
          filtered.push(item);
        }
      });
      return filtered;
    }
    else{
      return items;
    }
  }
})

.filter('filterAssignedStaff', function(){
  return function (items, assignedStaff){
    var filtered = [];
    if(assignedStaff){
      angular.forEach(items, function(item){
        if(item.projectManagerUserId == assignedStaff){
          filtered.push(item);
        }
        else if(item.loanOfficerUserId == assignedStaff){
          filtered.push(item);
        }
      });
      return filtered;
    }
    else{
      return items;
    }
  }
})



;




