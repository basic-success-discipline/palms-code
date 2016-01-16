'use strict';

angular.module('projects')


////////////////
// CONTROLLER //
////////////////

.controller('project.cost.funding_authCtrl', ['$scope', '$rootScope', '$state', '$resource', '$q', 'baseUrl', 'projectData', 'lookupAPI', 'dataFormats', 'log', 'modals', function($scope, $rootScope, $state, $resource, $q, baseUrl, projectData, lookupAPI, dataFormats, log, modals) {


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

  var loggingGroup = "Funding Authorization";
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
        message: "Save changes?",
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

  
  //////////////////////
  // INITIALIZE STUFF //
  //////////////////////
  $scope.showLoanFA = [1,2].indexOf($scope.project.programId) !=-1;
  $scope.showTAFA = [3,4].indexOf($scope.project.programId) !=-1; 
  // $scope.showLoanFA = true;
  // $scope.showTAFA = true;
  // END INITIALIZE STUFF


  ///////////////
  // LOAD DATA //
  ///////////////


  //define your resources
  var resources = {
    getLoanFundingAuth: $resource(baseUrl + '/api/FundingAuthorization', {}, {
      getByProjectId: { method: 'GET', params: { projectId: $scope.projectId}, isArray: true}
    }),
    saveLoanFundingAuth: $resource(baseUrl + '/api/FundingAuthorization/UpdateMultipleLoanFundingAuthorization', {}, {
      save: { method: 'PUT'}
    }),
    getTAFundingAuth: $resource(baseUrl + '/api/BudgetItem', {}, {
      getByProjectId: { method: 'GET', params: { projectId: $scope.projectId}, isArray: true}
    }),
    saveTAFundingAuth: $resource(baseUrl + '/api/BudgetItem/UpdateMultipleBudgetItem', {}, {
      save: { method: 'PUT'}
    }),
    project: $resource(baseUrl + '/api/Project', {}, {
      save: { method: 'PUT' }
    })
  };




  //load the data
  loadData();
  function loadData(){
    $scope.loading=true;
    //define what requests you want to run
    var requests;



    if($scope.showLoanFA){

      //keep collapsible panels open
      $scope.keepContractActionsOpenForIDs = [];
      if($scope.loanFA){
        for(var i=0; i<$scope.loanFA.length; i++){
          if($scope.loanFA[i].action!='delete' && $scope.loanFA[i].contractActionsOpen){
            $scope.keepContractActionsOpenForIDs.push($scope.loanFA[i].fundingAuthorizationId);
          }
        }
      }


      requests = [

        //get list of contract line items
        resources.getLoanFundingAuth.getByProjectId(function(results){
          $scope.loanFA = results;
          log.dir($scope.loanFA, 'Contract Line Items');
          $scope.updateLoanTotal();
          for(var i=0; i<$scope.loanFA.length; i++){
            $scope.loanFA[i].contractActions = $scope.loanFA[i].fundingAuthorizationDetails;
            $scope.updateLoanTotal($scope.loanFA[i]);
            $scope.loanFA[i].contractActionsOpen=false;
            
            for(var j=0; j<$scope.keepContractActionsOpenForIDs.length; j++){
              if($scope.keepContractActionsOpenForIDs[j] == $scope.loanFA[i].fundingAuthorizationId){
                $scope.loanFA[i].contractActionsOpen=true;
              }
            }
          }
        }).$promise
        ]
      }
      else if($scope.showTAFA){
        requests = [
      //get list of budget items
      resources.getTAFundingAuth.getByProjectId(function(results){
        $scope.TAFA = results;

        $scope.updateTATotal();
        log.dir($scope.TAFA, 'Budget items');
      }).$promise
      ]
    }

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
  'cost_category',
  'contract_action_type',
  'status_of_request',
  'assigned_staff'
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
    log.group("Saving Funding Auth");

    

    var saveRequests =[];
    var runRequests = true;
    
    if($scope.showLoanFA){
      if($scope.validate('loan')){

        log.dir($scope.loanFA, "Contract line items to be saved");
        saveRequests = [
        resources.saveLoanFundingAuth.save($scope.loanFA, function(results){
          console.log("Loan Funding Authorization was successfully saved!")
        }, function(error){
          modals.alert({head:"Loan Funding Authorization save failed", body:"See console for details"});
          console.error("Loan Funding Authorization save failed.");
          console.error(error);
        }).$promise
        ]
      }else{
        runRequests = false;
        console.error("Save attempt rejected because of validation failure");
        modals.alert({head:"Invalid Funding Authorization Records", htmlBody: $scope.invalidHTMLMessage});
      }
    }

    else if($scope.showTAFA){
      if($scope.validate('TA')){
        log.dir($scope.TAFA, "Budget items to be saved");
        saveRequests = [
        resources.saveTAFundingAuth.save($scope.TAFA, function(results){
          console.log("Technical Assistance Funding Authorization was successfully saved!")
        }, function(error){
          modals.alert({head:"Technical Assistance Funding Authorization save failed", body:"See console for details"});
          console.error("Technical Assistance Funding Authorization save failed.");
          console.error(error);
        }).$promise
        ]
      }else{
        runRequests = false;
        console.error("Save attempt rejected because of validation failure");
        modals.alert({head:"Invalid Funding Authorization Records", htmlBody: $scope.invalidHTMLMessage});
      }
    }

    if($scope.saveProject){
      log.dir($scope.project, "Project to be saved");
      saveRequests.push(
        resources.project.save($scope.project, function(results){
          console.log("Project was successfully saved!")
        }, function(error){
          modals.alert({head:"Project save failed", body:"See console for details"});
          console.error("Project save failed.");
          console.error(error);
        }).$promise)
    }


    if(runRequests){
    //when all requests are complete
    $q.all(saveRequests).then(function(data){
      console.log("All save requests complete");
      log.groupEnd("Saving Funding Auth");
      $scope.justSaved = true;
      if(reload==null || reload == true){
        loadData();
      }
    });
  }
  }

  // END SAVE FUNCTIONALITY



  $scope.validate = function(loanOrTA){
    var valid = true;
    $scope.invalidHTMLMessage = "<p class='red bold'>Funding Authorization save failed for these reasons:</p><ul class='invalid-message'>";

    if(loanOrTA == 'loan'){
      if($scope.eligible_cost != $scope.project.amount_to_obligate){
        $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>The total eligible cost must equal the total loan amount</li>");
        valid = false;
      }
    }else if(loanOrTA == 'TA'){
      if($scope.agency_cost!= $scope.project.eligible_cost){
        $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>The total agency cost must equal the eligible cost</li>");
        valid = false;
      }
      if($scope.agency_cost + $scope.recipient_cost != $scope.project.total_project_cost){
        $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>The total cost must equal total cost as a sum from the total amounts of all budget items</li>");
        valid = false;
      }
    }else{
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>Incorrect argument passed to validation function (tsk tsk)</li>");
      valid = false;
    }

    $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("</ul>");
    return valid;
  }


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


  ///////////////////
  // UPDATE TOTALS //
  ///////////////////

  $scope.updateLoanTotal = function(row){
    if(row){
      row.eligible_cost =0, row.total_cost=0;
      if(row.contractActions && row.contractActions.length>0){
        for(var i=0; i<row.contractActions.length; i++){
          if(row.contractActions[i].action!='delete'){
            row.eligible_cost+= row.contractActions[i].eligible_cost;
            row.total_cost+= row.contractActions[i].total_cost;
          }
        }
      }
      $scope.updateLoanTotal();
    }
    else{
      $scope.total_cost =0, $scope.eligible_cost = 0;
      for(var i=0; i<$scope.loanFA.length; i++){
        if($scope.loanFA[i].action!='delete'){
          $scope.total_cost += $scope.loanFA[i].total_cost;
          $scope.eligible_cost += $scope.loanFA[i].eligible_cost;
        }
      }
    }
  }

  $scope.updateTATotal = function(){
    $scope.agency_cost =0, $scope.recipient_cost = 0;
    for(var i=0; i<$scope.TAFA.length; i++){
      if($scope.TAFA[i].action!='delete'){
        $scope.agency_cost += $scope.TAFA[i].agency_cost;
        $scope.recipient_cost += $scope.TAFA[i].recipient_cost;
      }
    }
  }

  // END UPDATE TOTALS



  ///////////////////////////////////
  // ADDING RECORDS TO COLLECTIONS //
  ///////////////////////////////////


  $scope.addRecord = function(property, array){
    $scope.unsavedChanges=true;
    switch (property){
      case 'contractLineItem':
      array.push({
        action: 'add',
        costCategoryId: null,
        line_item_description: null,
        fundingAuthorizationDetails: [],
        // fundingAuthorizationId: null,
        notes: null,
        projectId: $scope.projectId,
        eligible_cost: null,
        total_cost: null
      });

      array[array.length-1].contractActions = array[array.length-1].fundingAuthorizationDetails
      $scope.updateLoanTotal(array[array.length-1]);
      break;
      case 'contractAction':
      array.push({
        action: 'add',
        actionId: null,
        date_received: null,
        decision_date: null,
        decisionByUserId: null,
        eligible_cost: null,
        fundingAuthorizationDetailId: null,
        fundingAuthorizationId: arguments[2],
        statusId: null,
        total_cost: null,  
      });
      break;
      case 'budgetItem':
      array.push({
        action: 'add',
        description: null,
        recipient_cost: null,
        projectId: $scope.projectId,
        technicalFundingAuthorizationId: null,
        agency_cost: null 
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
      if(array[index].action!='add'){
        $scope.updateAction(array[index], 'delete');
      }
      else{
        array.splice(index, 1);
      }
    }else{
      array.splice(index, 1);
    }
  }
  // END DELETE RECORD


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
  $scope.percent = function(decimalAmount){
    var percent =  dataFormats['percent'](decimalAmount *100);
    return percent;
  }

  // END READ-ONLY FORMATTING



  ////////////////////////////////
  // COLLAPSIBLE PANEL TOGGLING //
  ////////////////////////////////

  $scope.togglePanel = function(row){
    row.contractActionsOpen = !row.contractActionsOpen;
  }
  // END COLLAPSIBLE PANEL TOGGLING


  $scope.indicateProjectSaveNeeded = function(){
    $scope.saveProject = true;
  }


}])
// END CONTROLLER


/////////////////////////////
// AVAILABLE OPTION FILTER //
/////////////////////////////

.filter('availableOptions',['log', function(log) {
  return function (possibleOptions, currentOptions, thisOption, idProperty, componentIdProperty){
    var filtered = []; 
    var componentLookUpId = componentIdProperty || 'componentLookUpId';
    angular.forEach(possibleOptions, function(possibleOption){
      var remove = false;
      angular.forEach(currentOptions, function(currentOption){
        if(possibleOption[componentLookUpId] == currentOption[idProperty] && currentOption.action!='delete'){
          remove = true;
        }
      });
      if(possibleOption[componentLookUpId] == thisOption[idProperty]){
        remove = false;
      } 
      if(!remove){
        filtered.push(possibleOption);
      }
    });
    return filtered;
  }
}])
// END AVAILABLE OPTION FILTER




;