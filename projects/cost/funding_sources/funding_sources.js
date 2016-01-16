'use strict';

angular.module('projects')


.controller('project.cost.funding_sourcesCtrl', ['$scope', '$rootScope', '$state', '$resource', '$q', 'baseUrl', 'projectData', 'dataFormats', 'lookupAPI', 'log', 'modals', function($scope, $rootScope, $state, $resource, $q, baseUrl, projectData, dataFormats, lookupAPI, log, modals) {


///////////////////////
// GET BASIC PROJECT //
///////////////////////

projectData.currentView = $state.current.name;
$scope.project = projectData.project;

if(!$scope.project){
  $state.go('project');
  return;
}


$scope.projectId = $scope.project.projectId;
if($scope.project.projectId != $state.params.projectId){
  modals.alert({head: "There has been an error!", body:"You may be viewing the wrong data!\n Please contact the developer."});
  console.error({"Project Id" : $scope.project.projectId, "State Param": $state.params.projectId});
}
// END GET BASIC PROJECT 

//////////////////////////
// SET UP LOGGING GROUP //
//////////////////////////

var loggingGroup = "Funding Sources";
log.group(loggingGroup);

$scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
});
// END SET UP LOGGING GROUP



  //////////////////////////
  // CONFIRM SAVE ON EXIT //
  //////////////////////////

  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if(!$scope.exitConfirmed && $scope.unsavedChanges){
      event.preventDefault();
      modals.yesNoCancel({
        message:"Save changes?",
        yes: function(){
          $scope.save(false);
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        no: function(){
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        cancel: function(){}
      })
    }
  });
  // END CONFIRM SAVE ON EXIT




///////////////
// LOAD DATA //
///////////////


//define your resources
var resources = {
  getFundingSources: $resource(baseUrl + '/api/FundingSource/GetFundingSourceByProjectId', {}, {
    getByProjectId: { method: 'GET', params: { projectId: $scope.projectId}, isArray: true}
  }),
  saveFundingSources: $resource(baseUrl + '/api/FundingSource/UpdateMultipleFundingSource', {}, {
    save: { method: 'PUT'}
  })
};



//load the data
loadData();
function loadData(){
  $scope.loading=true;
  //define what requests you want to run
  var requests = [

    //get list of Funding sources
    resources.getFundingSources.getByProjectId(function(results){
      $scope.sources = results;
      $scope.updateTotals();
      log.dir($scope.sources, 'Funding Sources');
    }).$promise,

  ];

  //When all requests are run
  $q.all(requests).then(function(data){ 
    
    $scope.loading=false;
    $scope.unsavedChanges=false;
  });
}
$scope.loadData = loadData;

// END LOAD DATA


/////////////////
// GET LOOKUPS //
/////////////////

//enumerate lookups needed
var lookups = [
'funding_program'
];

//go get 'em
lookupAPI.doConcurrentLookups(lookups).then(function(data){
  $scope.lookups = data;
  log.dir($scope.lookups, 'Lookups');
})
// END GET LOOKUPS

////////////////////////
// SAVE FUNCTIONALITY //
////////////////////////

$scope.save = function(reload){
  log.group("Saving Funding Sources");
  log.dir($scope.sources, "Funding Sources to be saved");
  

  var saveRequests = [
    resources.saveFundingSources.save($scope.sources, function(results){
      console.log("Funding Sources successfully saved!")
    }, function(error){
      modals.alert({head:"Funding Sources save failed", body:"See console for details"});
      console.error("Funding Sources save failed.");
      console.error(error);
    }).$promise,
  ];

  $q.all(saveRequests).then(function(data){
    console.log("All save requests complete");
    log.groupEnd("Saving Funding Sources");
    $scope.justSaved = true;
    if(reload==null || reload == true){
      loadData();
    }
  })
}

// END SAVE FUNCTIONALITY



///////////////////////////////
// UPDATE ACTION ON RECORD //
///////////////////////////////

$scope.updateAction = function(actionObject){
  $scope.unsavedChanges =true;
  if(['edit', 'delete', 'add'].indexOf(arguments[1])!=-1){
    if(!(actionObject.action=='add' && arguments[1]=='edit')){
      actionObject.action=arguments[1];
    }
  }else if(actionObject.action!='add'){
    actionObject.action='edit';
  }
}
// END UPDATE ACTION ON RECORD



///////////////////////////////////
// ADDING RECORDS TO COLLECTIONS //
///////////////////////////////////


  $scope.addRecord = function(property, array){
    $scope.unsavedChanges=true;
     switch (property){
      case 'funding source':
        array.push({
          action: 'add',
          amountToObligate: null,
          bindingCommitmentDate: null,
          cost: null,
          fundingSourceId: null,
          listYear: null,
          notes: null,
          plannedAmountToFund: null,
          primaryFundingSource: null,
          programId: null,
          project: null,
          projectId: $scope.projectId
        });
        break;
      default:
        console.error("Could not add record for " + property);
     } 
  }

  // END ADD RECORD


  /////////////////////////////////////////////////////
  // DELETE RECORD FROM COLLECTION OF ACTION OBJECTS //
  /////////////////////////////////////////////////////
  $scope.deleteRecord = function(array, index){
    if (array[index].hasOwnProperty('action')){
      $scope.updateAction(array[index], 'delete');
    }else{
      array.splice(index, 1);
    }
  }
  // END DELETE RECORD


  ///////////////////
  // UPDATE TOTALS //
  ///////////////////

  $scope.updateTotals = function(){
   var totals = {
    plannedAmountToFund: 0,
    cost: 0,
    amountToObligate: 0
  };

  angular.forEach($scope.sources, function(source, index){
    if(source.action!='delete'){
      for(var key in totals){
        if(source.hasOwnProperty(key)){
          totals[key] += source[key];
        }
      }
    }
  });

  $scope.totals = totals;

}


  // END UPDATE TOTALS



  ///////////////////////////////
  // READ-ONLY DATA FORMATTING //
  ///////////////////////////////

  $scope.money = function(decimalAmount){
    var money =  dataFormats['money'](decimalAmount);
    return money;
  }

  // END READ-ONLY FORMATTING


}])

;