'use strict';

angular.module('projects')


.controller('project.amortization.loan_termsCtrl', ['$scope', '$state', '$rootScope', '$resource', '$q','$timeout', 'baseUrl', 'log', 'projectData','dataFormats', 'modals', 'lookupAPI', function($scope, $state, $rootScope, $resource, $q, $timeout, baseUrl, log, projectData, dataFormats, modals, lookupAPI) {


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

  var loggingGroup = "Loan Terms";
  log.group(loggingGroup);

  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP



  $scope.DW = $scope.project.fundingProgram.program_code == 'DW';
  $scope.CW = $scope.project.fundingProgram.program_code == 'CW';

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



  ///////////////
  // LOAD DATA //
  ///////////////

  var include = ['FinancialAssistanceDetail'];

  //define your resources
  var resources = {
    getLoanTerms: $resource(baseUrl + '/api/Project', {}, {
      get: { method: 'GET', params: { projectId: $scope.projectId, include : include.join()}, isArray: false},
      save: { method: 'PUT' }
    }),

  };


  $scope.lookups = {};

  //load the data
  loadData();
  function loadData(){
    $scope.loading=true;
    // $scope.disableEdit = true;
    //define what requests you want to run
    var requests;

    requests = [

        //get list of contract line items
        resources.getLoanTerms.get(function(results){
          $scope.projectToSave = results;
          $scope.terms = $scope.projectToSave.financialAssistanceDetail;
          $scope.calculateLoanTerm();
          $scope.generateCalculatedLookups();
          log.dir($scope.terms, 'Terms');
        }).$promise
        ]

    //When all requests are run
    $q.all(requests).then(function(data){

      $scope.loading=false;
      $scope.unsavedChanges=false;
    });
  }

  $scope.loadData = loadData;

  // END LOAD DATA


  //enumerate lookups needed
  var lookups = [

  //for various entry fields
  'admin_fees_based_on',
  'admin_fees_paid_over',
  'admin_fees_charged_on',
  'interest_rate_type',
  'dsr_requirements',
  'loan_amortization_method',
  'assistance_type',
  'funding_source',
  'original_number'

  ];



  //go get 'em
  lookupAPI.doConcurrentLookups(lookups).then(function(data){

    $scope.lookups = angular.extend($scope.lookups, data);    
    log.dir($scope.lookups, 'Lookups');
    $timeout(function(){$scope.disableEdit=true;}, 100); //needed for select chosen elements to disable properly 
    
  })
  // END GET LOOKUPS


  // save functionality
  $scope.save = function(reload){

    if($scope.validate()){
      log.group("Saving Loan Terms");
      log.dir(angular.copy($scope.terms), 'Loan Terms to be saved');
      $scope.terms.action = 'edit';



      var saveRequests = [
      resources.getLoanTerms.save($scope.projectToSave, function(results){
        console.log("Loan Terms successfully saved!")
      }, function(error){
        modals.alert({head:"Loan Terms save failed", body:"See console for details"});
        console.error("Loan Terms save failed.");
        console.error(error);
      }).$promise,
      ];




    $q.all(saveRequests).then(function(data){
      console.log("All save requests complete");
      log.groupEnd("Saving Loan Terms");
      $scope.justSaved = true;
      if(reload==null || reload == true){
        loadData();
      }
    })
}else{
  console.error("Save attempt rejected because of validation failure");
  modals.alert({head:"Invalid Loan Terms data", htmlBody: $scope.invalidHTMLMessage});
}
}


$scope.validate = function(){
  var valid = true;
  $scope.invalidHTMLMessage = "<p class='red bold'>Loan Terms save failed for these reasons:</p><ul class='invalid-message'>";


  //make sure dates are on right day of month
  var dates = [{value: $scope.terms.date_first_principal_payment, string: "Date of First Principal Payment"},
  {value: $scope.terms.date_first_interest_payment, string: "Date of First Interest Payment"},
  {value: $scope.terms.date_first_reserve_deposit, string: "Date of First Reserve Deposit"}]
  angular.forEach(dates, function(date){
    if(date.value != null){
      var dayOfMonth = new Date(date.value).getUTCDate();
      if($scope.terms.day_of_payment != dayOfMonth){
        valid=false;
        $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li><b>" + date.string + "</b> must be on day <b>" + $scope.terms.day_of_payment +"</b> of the month, or you must change your value for <b>Day of the Month Payment Will be Made</b> </li>");
      }
    }
  })
  
  
  $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("</ul>");
  return valid;
}


 //updating action on edit
  $scope.updateAction = function(actionObject){ //method, property 
    $scope.unsavedChanges=true;
    if(actionObject){
      if(['edit', 'delete', 'add'].indexOf(arguments[1])!=-1){
        if(!(actionObject.action=='add' && arguments[1]=='edit')){
          actionObject.action=arguments[1];
        }
      }else if(actionObject.action!='add'){
        actionObject.action='edit';
      } 
    }
  }






  $scope.generateCalculatedLookups = function(){
  //This is complete garbage design but it was the only way I could figure out how to get the "paid every" dropdowns to work correctly. 
  //For whatever godforsaken reason, the ng-model would point to an options index instead of its value. 
  //This bojanked structure seems to avoid that behavior
  $scope.lookups['paid_every'] = [{value: 1, otherVal:1},{value: 3, otherVal:3},{value: 6, otherVal:6},{value: 12, otherVal:12}];
  $scope.lookups['day_of_month_principal_paid'] = Array.apply(null, Array(31)).map(function (_, i) {return {value: i+1, otherVal:i+1};});

  $scope.lookups['date_of_first'] = [];
  $scope.terms.day_of_payment ? '' : $scope.terms.day_of_payment = 1;
  for(var i = 1998; i<=2020; i++){
    for(var j= 1; j<=12; j++){
      $scope.lookups['date_of_first'].push(j  + "/" + $scope.terms.day_of_payment + "/" + i);
    }
  }

}

$scope.calculateLoanTerm = function(){
  $scope.terms.loanTerm = Math.round($scope.terms.principal_payment_plan * $scope.terms.number_principal_payments/12 * 10) / 10;

}



$scope.toggleEditing = function(){
  if($scope.disableEdit){
    $scope.disableEdit=false;
  }else{
    $scope.disableEdit=true;
    $scope.loadData();
  }

}

$scope.openLoanSetupInstructions = function(){
  modals.alert({
    head: "Loan Setup Instructions", 
    htmlBody:"<h1>Monthly Loans</h1><p class='purple'>This pop-up still needs some work</p><ul class='list-group'><li class='list-group-item'> Choose create schedule, set correct closing date, be sure amount is correct (it is from Amount to Obligate).</li><li class='list-group-item'>Check to create the schedule and go to loan schedule tab.  Hit recalculate once and check on Lock Amort Amount for the first payment due.  Also lock in first Principal Amount due.</li><li class='list-group-item'>Once disbursements begin calculate based on Actual Disbursements.</li><li class='list-group-item'>When all disbursements are complete, change amount to Obligate to the final total amount disbursed.  This will remove extra records on loan schedule if they take less than was orginally planned.</li></ul>"});    
}

$scope.toggleFinancialBenefits = function(){
  $scope.financialBenefits = !$scope.financialBenefits;
}

$scope.money = function(decimalAmount){
  var money =  dataFormats['money'](decimalAmount);
  return money;
}

$scope.percent = function(decimalAmount){
  var percent =  dataFormats['percent'](decimalAmount);
  return percent;
}




}]);
