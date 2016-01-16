'use strict';

angular.module('projects')


.controller('project.cost.agreement_historyCtrl', ['$scope', '$rootScope', '$state', '$window', '$resource', '$q', 'baseUrl', 'projectData', 'lookupAPI', 'log', 'modals', function($scope, $rootScope, $state, $window,$resource, $q, baseUrl, projectData, lookupAPI, log, modals) {


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

  var loggingGroup = "Agreement History";
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
// include=loandocuments,userdocuments
  var include = ['loandocuments','userdocuments'];

  //define your resources
  var resources = {
    getAgreementHistory: $resource(baseUrl + '/api/AgreementHistoryAction/GetByProjectId', {}, {
      getByProjectId: { method: 'GET', params: { projectId: $scope.projectId, include: include.join()}, isArray: true}
    }),
    saveAgreementHistory: $resource(baseUrl + '/api/AgreementHistoryAction/UpdateMultipleAgreementHistoryAction', {}, {
      save: { method: 'PUT', isArray:true }
    }) 
  };



  //load the data
  loadData();
  function loadData(){
    $scope.loading=true;

    $scope.keepRowsOpenForIds = [];
    if($scope.agreementHistory){
      for(var i=0; i<$scope.agreementHistory.length; i++){
        if($scope.agreementHistory[i].action!='delete' && $scope.agreementHistory[i].openPanel){
          $scope.keepRowsOpenForIds.push($scope.agreementHistory[i].agreementHistoryActionId);
        }
      }
    }
    //define what requests you want to run
    var requests = [

    resources.getAgreementHistory.getByProjectId(function(results){
      $scope.agreementHistory = results;
      for(var i=0; i<$scope.agreementHistory.length; i++){
        var row = $scope.agreementHistory[i];
        row.openPanel=false;
        row.loanDocuments = row.loanDocuments ? row.loanDocuments : [];
        row.userDocuments = row.userDocuments ? row.userDocuments : [];

        for(var j=0; j<$scope.keepRowsOpenForIds.length; j++){
          if($scope.keepRowsOpenForIds[j] == row.agreementHistoryActionId){
            console.log("here");
            row.openPanel=true;
          }
        }

      }


      log.dir($scope.agreementHistory, 'Agreement history');
    }).$promise

    ];

    //When all requests are run
    $q.all(requests).then(function(data){
      $scope.loading=false;
      $scope.unsavedChanges = false;

    });
  }

  $scope.loadData = loadData;

// END LOAD DATA


//enumerate lookups needed
var lookups = [
'agreement_history_action_type'
];

  //go get 'em
  lookupAPI.doConcurrentLookups(lookups).then(function(data){
    $scope.lookups = data;
    log.dir($scope.lookups, 'lookups');
  })






////////////////////////
// SAVE FUNCTIONALITY //
////////////////////////

  $scope.save = function(reload){
    log.group("Saving Agreement History");
    log.dir($scope.agreementHistory, "Agreement history actions to be saved");

     
    

    var saveRequests = [
      resources.saveAgreementHistory.save($scope.agreementHistory, function(results){
        console.log("Agreement History was successfully saved!")
      }, function(error){
        modals.alert({head:"Agreement History save failed", body:"See console for details"});
        console.error("Agreement History save failed.");
        console.error(error);
      }).$promise
    ];

    $q.all(saveRequests).then(function(data){
      console.log("All save requests complete");
      log.groupEnd("Saving Agreement History");
      $scope.justSaved = true;
      $window.setTimeout(function(){
        $scope.justSaved =false;
        $scope.$apply();
      }, 6000);
      if(reload==null || reload == true){
        loadData();
      }
    });
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
        case 'action':
        if (!array){$scope.agreementHistory = array =[];}
          array.push({
            action: 'add',
            action_date: new Date(),
            actionPurpose: null,
            actionTypeId: null,
            agreementHistoryActionId: null,
            amendmentNumber: null,
            assistanceTypeId: null,
            ceiling_amount: null,
            loanDocuments: [],
            agreement_number: null,
            notes: null,
            userDocuments: [],
            projectId: $scope.projectId,
            mustBeSaved: true
          });
          break;
        case 'document':  //this will actually be more complex since actual documents are getting generated.
          array.push({
            action: 'add',
            addedByStaffId: null, //should be generated by name of logged in user
            dateAdded: new Date(),
            documentId: null,
            documentType: null,
            referenceName: null 
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



  $scope.optionString = function(property, option){
    switch (property){
      case 'assignedStaff':
      return option; //this probably won't be needed 
      break;
      default:
      console.error("Error in creating option string for: " + property);
    }
  }

  
  $scope.togglePanel = function(row){
    row.openPanel = !row.openPanel;
  }

  $scope.viewDocument = function(doc){

    $window.open(baseUrl + doc.relativePath.replace('~', ''), '_blank');
  }

  $scope.openCreateLoanDocuments = function (row) {
    $window.open("/#!/create_loan_documents?projectId=" + $scope.projectId + "&actionId=" + row.agreementHistoryActionId, '_blank');
    // $window.open("/#!/create_loan_documents?projectId=" + $scope.projectId + "&actionId=" + row.agreementHistoryActionId, null, "height=820,width=1024,scrollbars=yes,resizable=yes");
  }

  $scope.openAddUserDocuments = function(row){
    modals.uploadFiles({
      agreementHistoryActionId: row.agreementHistoryActionId,
      ok: function(){
        row.showReloadMessage = true;
        $scope.unsavedChanges=true;
      }
    });
  }


}]);