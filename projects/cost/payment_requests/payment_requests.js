'use strict';

angular.module('projects')


.controller('project.cost.payment_requestsCtrl', ['$scope', '$state', '$rootScope', '$resource', '$q', 'baseUrl', 'lookupAPI', 'projectData', 'log', 'dataFormats', 'modals', function($scope, $state, $rootScope, $resource, $q, baseUrl, lookupAPI, projectData, log, dataFormats, modals) {

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

  var loggingGroup = "Payment Requests";
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
        message: "Save changes to this payment request?",
        yes: function(){
          $scope.save($scope.requests[$scope.currentNumber -1], false);
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        no: function(){
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        cancel: function(){}
      });
    }
  });
  // END CONFIRM SAVE ON EXIT



  // Figure out which payment request to view now
  $scope.currentNumber = projectData.currentPaymentRequestNumber || 1;

  var APPROVED_ID = 186;
  $scope.loan = $scope.project.fundingProgram.loan_assistance;
  $scope.grant = !$scope.project.fundingProgram.loan_assistance;




  //includes for payment request call
  var include = [ 
  'PaymentRequestDetails'
  , 'PaymentRequestDetails.FundingAuthorization.CostCategory'
  ];

  //define non-lookup resources
  var resources = {
    paymentRequest: $resource(baseUrl + '/api/PaymentRequest', {}, {
      getByProjectId: { method: 'GET', params: {projectId: $scope.projectId, include: include.join()}, isArray: true},  
    }),
    updatePaymentRequest: $resource(baseUrl + '/api/PaymentRequest/UpdatePaymentRequest', {}, {
      update:{method :'PUT'}
    }),
    savePaymentRequest: $resource(baseUrl + '/api/PaymentRequest/SavePaymentRequest', {}, {
      save:{method :'POST'}
    }),
    updateMultiplePaymentRequests: $resource(baseUrl + '/api/PaymentRequest/UpdateMultiplePaymentRequests', {},{
      update:{method:'PUT'}
    }),
    getLoanFundingAuth: $resource(baseUrl + '/api/FundingAuthorization', {}, {
      getByProjectId: { method: 'GET', params: { projectId: $scope.projectId, include: 'CostCategory'}, isArray: true}
    }),
    // getLoanFundingAuth: $resource(baseUrl + '/api/FundingAuthorization/GetLoanFundingAuthorizationByProjectId', {}, {
    //   getByProjectId: { method: 'GET', params: { projectId: $scope.projectId, include: 'CostCategory'}, isArray: true}
    // }),
    getBudgetItems: $resource(baseUrl + '/api/BudgetItem', {}, {
      get: { method: 'GET', params: { projectId: $scope.projectId}, isArray: true}
    })
  };


  

  loadData();
  function loadData(callback){
    $scope.loading=true;

  //define what requests you want to run
  var requests = [

    //get list of payment requests
    resources.paymentRequest.getByProjectId(function(results){
      $scope.requests = results;
      

      //do some calulations
      var total =0, costsIncurred = {};
      
      //for each request
      for(var i =0; i<$scope.requests.length; i++){
        var request = $scope.requests[i];


        //set paymentRequestNumber
        request.paymentRequestNumber = i + 1;
        
        //set totalCostToDate and update totals
        request.totalCostToDate = total;

        
        // set project cost incurred and balance for payment request details
        for(var j =0; j<request.paymentRequestDetails.length; j++){
          var prDetails = request.paymentRequestDetails[j];
          // prDetails.authorized_budget = prDetails.fundingAuthorization.eligible_cost;
          // var costCatId = prDetails.costCategoryId.toString();
          var costCatId = prDetails.fundingAuthorization.costCategory.componentName.toString(); //this is wrong, but I'm using it for testing now
          prDetails.totalProjectCostIncurred = costsIncurred[costCatId] || 0;
          prDetails.balanceRemainingFromSource = prDetails.authorized_budget - prDetails.totalProjectCostIncurred;
        }

        $scope.updateTotal(request);


        //if this is an approved request
        if(request.statusId == APPROVED_ID){

          //add it to the total
          total +=  request.amount_requested;


          // add payment request details costs incurred to total per-cost-category total costs incurred
          for(var j =0; j<request.paymentRequestDetails.length; j++){
            var prDetails = request.paymentRequestDetails[j];
            // var costCatId = prDetails.fundingAuthorization.costCategoryId.toString();
            var costCatId = prDetails.fundingAuthorization.costCategory.componentName.toString(); //this is wrong, but I'm using it for testing now
            if(costsIncurred[costCatId]==null){
              costsIncurred[costCatId] = 0;
            }
            costsIncurred[costCatId] += prDetails.amount_requested;
          }
        }
      }

      $scope.approvedInvoices = total;
      $scope.costsIncurred = costsIncurred;
      // log.dir($scope.costsIncurred, 'Costs Incurred');

      log.dir($scope.requests, 'Payment Requests');
    }).$promise
]
if($scope.loan){
  //get list of contract line items
  requests.push(
    resources.getLoanFundingAuth.getByProjectId(function(results){
      $scope.contractLineItems = results;
      
      var authorized_budget = 0;
      angular.forEach($scope.contractLineItems, function(lineItem, index){
        authorized_budget += lineItem.eligible_cost;
      })
      $scope.authorized_budget = authorized_budget;
      $scope.requireFundingAuth = $scope.contractLineItems.length == 0;
      log.dir($scope.contractLineItems, 'Contract Line Items');
      

    }).$promise
    )
}
  else if($scope.grant){
    //get list of contract line items
  requests.push(
    resources.getBudgetItems.get(function(results){
      $scope.budgetItems = results;
      var authorized_budget = 0;
      angular.forEach($scope.budgetItems, function(budgetItem, index){
        authorized_budget += budgetItem.agency_cost;
      })
      $scope.authorized_budget = authorized_budget;
      $scope.requireFundingAuth = $scope.budgetItems.length == 0;
      $scope.thisSource = true;
      log.dir($scope.budgetItems, 'Budget Items');
    }).$promise
  )
}

  

  //When all requests are run
  $q.all(requests).then(function(data){

    if ($scope.requests.length==0){
      $scope.addRecord();
    }

    //set lookups for payment request to use
    $scope.unsavedChanges =false;
    $scope.loading=false; 
    $scope.addedAlready=false;
    $scope.viewPaymentRequest($scope.currentNumber);
    if(callback){
      callback();
    }
    
  });

}

$scope.loadData = loadData;

//lookups needed
var lookups = [
'assigned_staff',
'payment_request_status'
];

  //lookups
  lookupAPI.doConcurrentLookups(lookups).then(function(data){
    $scope.lookups = data;
    log.dir($scope.lookups, 'Lookups');
  })


  //updating action on edit
  $scope.updateAction = function(actionObject){ //method, property 
    $scope.unsavedChanges = true;
    if(['edit', 'delete', 'add'].indexOf(arguments[1])!=-1){
      if(!(actionObject.action=='add' && arguments[1]=='edit')){
        actionObject.action=arguments[1];
      }
    }else if(actionObject.action!='add'){
      actionObject.action='edit';
    } 
  }



  //adding records to collections
  $scope.addRecord = function(){

    var nextNumber = 1;
    for(var i=0; i<$scope.requests.length; i++){
      if ($scope.requests[i].action !='delete'){
        nextNumber++;
      }
    }

    var totalCostToDate = 0;
    if($scope.requests.length>0){
      var prevRequest = $scope.requests[nextNumber-2];
      totalCostToDate = prevRequest.totalCostToDate;
      totalCostToDate += prevRequest.statusId == APPROVED_ID ? prevRequest.amount_requested : 0;
    }

    var prDetails = [];
    if($scope.loan){
    angular.forEach($scope.contractLineItems, function(record, index){
      var costIncurred = $scope.costsIncurred[record.costCategory.componentName.toString()] || 0; 
      
      prDetails.push({
        action: 'add',
        amount_requested: null,
        authorized_budget: record.eligible_cost,
        balanceRemainingFromSource: record.eligible_cost - costIncurred,
        fundingAuthorizationId: record.fundingAuthorizationId,
        fundingAuthorization: record,
        mbe_amount: null,
        notes: null,
        paymentRequestDetailId: null,
        paymentRequestId: null, //is this okay? Each of these records will be attached to the new paymentrequest
        totalProjectCostIncurred: costIncurred,
        wbe_amount: null
      })
    })
  }
  else if ($scope.grant){
    angular.forEach($scope.budgetItems, function(record, index){
      var costIncurred = $scope.costsIncurred[record.description] || 0;
      
      prDetails.push({
        action: 'add',
        amount_requested: null,
        authorized_budget: record.agency_cost,
        balanceRemainingFromSource: record.agency_cost - costIncurred,
        technicalFundingAuthorizationId: record.technicalFundingAuthorizationId,
        technicalFundingAuthorization: record,
        mbe_amount: null,
        notes: null,
        paymentRequestDetailId: null,
        paymentRequestId: null, //is this okay? Each of these records will be attached to the new paymentrequest
        totalProjectCostIncurred: costIncurred,
        wbe_amount: null
      })
    })
  }



    var length = $scope.requests.push({

      //missing total project cost field
      action: 'add',
      amount_requested: null,
      checkedByUserId: null,
      date_checked: null,
      date_logged: null,
      date_received: new Date(),
      decisionByUserId: null,
      decision_date: null,
      last_payment_request: null,
      loggedInByUserId: null,
      notes: null,
      paymentRequestDetails: prDetails,
      paymentRequestId: null,
      paymentRequestNumber: nextNumber,
      projectId: $scope.projectId,
      statusId: null,
      total_to_pay: null, 
      totalCostToDate: totalCostToDate
    });
    $scope.updateTotal($scope.requests[length-1]);
    $scope.viewPaymentRequest(length, true);
    $scope.addedAlready = true;
  }


  $scope.deleteRecord = function(index){

    modals.yesNoCancel({
      head: "Confirm Payment Request Deletion",
      message: "If you delete this payment request, other payment requests may be modified as well.\n\nTHIS ACTION CANNOT BE UNDONE. \n\nAre you sure you want to delete this payment request?",
      yes: function(){
        log.group("Deleting Payment Request");
      log.dir($scope.requests[index], 'payment request to be deleted');
      if ($scope.requests[index].hasOwnProperty('action')){
        $scope.updateAction($scope.requests[index], 'delete');
      }

      //handle numbers and totals after the deleted
      for(var i=index+1; i<$scope.requests.length; i++){
        if ($scope.requests[i].action !='delete'){
          $scope.requests[i].paymentRequestNumber -= 1;
          $scope.updateAction($scope.requests[i]);
        }
      }

      $scope.unsavedChanges = true;
      var newCurrent = $scope.requests[index].paymentRequestNumber - 1;
      $scope.currentNumber = newCurrent >1 ? newCurrent : 1;
      log.groupEnd("Deleting Payment Request");
      $scope.saveAll();

      }
    });

  }




  $scope.save = function(paymentRequest, reload){

    if($scope.validate(paymentRequest)){



      log.group("Saving Payment Request");
      log.dir(paymentRequest, 'payment request to be saved');

      if(paymentRequest.action=='add'){
      //this is to prevent any changes to fundingAuthorization through the payment requests API
      //really, this should be done at the server level
      delete paymentRequest.fundingAuthorization;

      var saveRequests = [
      resources.savePaymentRequest.save(paymentRequest, function(results){
        console.log("Payment Request was successfully saved!")
      }, function(error){
        modals.alert({head:"Payment Request save failed", body:"See console for details"});
        console.error("Payment request save failed.");
        console.error(error);
      }).$promise
      ];
    }else{
      var saveRequests = [
      resources.updatePaymentRequest.update(paymentRequest, function(results){
        console.log("Payment Request was successfully updated!")
      }, function(error){
        modals.alert({head:"Payment Request update failed", body:"See console for details"});
        console.error("Payment request update failed.");
        console.error(error);
      }).$promise
      ];
    }
    
    $q.all(saveRequests).then(function(data){
      $scope.unsavedChanges = false;
      console.log("All save requests complete");
      log.groupEnd("Saving Payment Request");
      $scope.justSaved = true;
      if(reload==null || reload == true){
        loadData();
      }
    })
  }else{
    console.error("Save attempt rejected because of validation failure");
    modals.alert({head:"Invalid Payment Request", htmlBody: $scope.invalidHTMLMessage});
  }
}




$scope.saveAll = function(reload){
  log.group("Saving All Payment Requests");
  log.dir($scope.requests, 'payment requests to be saved');

  var saveRequests = [
  resources.updateMultiplePaymentRequests.update($scope.requests, function(results){
    console.log("Payment Requests were successfully saved!")
  }, function(error){
    console.error("Payment requests save failed.");
    console.error(error);
  }).$promise
  ];


  $q.all(saveRequests).then(function(data){
    $scope.unsavedChanges = false;
    console.log("All save requests complete");
    log.groupEnd("Saving All Payment Requests");
    $scope.justSaved = true;
    if(reload==null || reload == true){
      loadData();
    }
  })
}

$scope.validate = function(paymentRequest){
  var valid = true;
  $scope.invalidHTMLMessage = "<p class='red bold'>Payment Request save failed for these reasons:</p><ul class='invalid-message'>";


  var val1 = paymentRequest.amount_requested;
  var val2 = paymentRequest.totals.amount_requested;
  var val3 = paymentRequest.total_to_pay;
  var approved = paymentRequest.statusId == APPROVED_ID;

  if(!(val1 == val2 && val2 == val3) && approved){
    $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li><ul><li>Additionnal Cost from this Request</li><li>The total of column 'Additional Costs from this Request'</li><li>Total to Pay</li></ul> <p style='margin-left: 25px;'> These values must be equivalent in order to save an approved payment request.</p></li>");
    valid = false;
  }


  var totals = {
    amount_requested: 0,
    authorized_budget: 0,
    balanceRemainingFromSource: 0,
    mbe_amount: 0,
    totalProjectCostIncurred: 0,
    wbe_amount: 0
  };
  
  angular.forEach(paymentRequest.paymentRequestDetails, function(row, index){
    for (var key in totals ){
      totals[key] += row[key];
    }
    if(row.amount_requested > row.balanceRemainingFromSource){
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>You are trying to spend more money than what is left in this category: " + row.fundingAuthorization.costCategory.componentName + "</li>");
       valid = false;
    }
    if($scope.loan && row.mbe_amount > row.amount_requested){
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>MBE amount should not exceed Additional Cost for this category:" + row.fundingAuthorization.costCategory.componentName + "</li>");
      valid = false;
    }
    if($scope.loan && row.wbe_amount > row.amount_requested){
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>WBE amount should not exceed Additional Cost for this category:" + row.fundingAuthorization.costCategory.componentName + "</li>");
      valid = false;
    }

  })   
  

  $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("</ul>");
  return valid;
}


$scope.updateTotal = function(paymentRequest){
  if($scope.loan){
  var totals = {
    amount_requested: 0,
    authorized_budget: 0,
    balanceRemainingFromSource: 0,
    mbe_amount: 0,
    totalProjectCostIncurred: 0,
    wbe_amount: 0
  };

  angular.forEach(paymentRequest.paymentRequestDetails, function(row, index){
    for (var key in totals ){
      totals[key] += row[key];
    }
  })   
  paymentRequest.totals = totals;
}
else if($scope.grant){
  var totals = {
    wifa_amount_requested: 0,
    wifa_authorized_budget: 0,
    wifa_balanceRemainingFromSource: 0,
    wifa_totalProjectCostIncurred: 0,
    match_amount_requested: 0,
    match_authorized_budget: 0,
    match_balanceRemainingFromSource: 0,
    match_totalProjectCostIncurred: 0
  };

  angular.forEach(paymentRequest.paymentRequestDetails, function(row, index){
    for (var key in totals ){
      totals[key] += row[key];
    }
  })   
  paymentRequest.totals = totals;
}
}

  //go to a certain payment request
  $scope.viewPaymentRequest = function(paymentRequestNumber, viewingNewRequest){
    if($scope.unsavedChanges){
     modals.yesNoCancel({
      message: "Save changes to this payment request?",
      yes: function(){
        $scope.save($scope.requests[$scope.currentNumber - 1], false);
        goToPaymentRequest(paymentRequestNumber);

      },
      no: function(){
        loadData(function(){
          if(viewingNewRequest){
            $scope.addRecord();
          }else{
            goToPaymentRequest(paymentRequestNumber);
          }
        });
      },
      cancel: function(){}
    });
   }else{
    goToPaymentRequest(paymentRequestNumber);
  }



  function goToPaymentRequest(paymentRequest) {
    if(paymentRequestNumber>0 && paymentRequestNumber<=$scope.requests.length){
      $scope.currentNumber =  paymentRequestNumber;
      projectData.currentPaymentRequestNumber = $scope.currentNumber;
    }
  }
}

$scope.toggleSource = function(bool){
  $scope.thisSource = bool;
}

$scope.money = function(decimalAmount){
  var money =  dataFormats['money'](decimalAmount||0);
  return money;
}



   //formatting name displayed in dropdowns
   $scope.optionString = function(property, option){
    switch (property){
      case 'assignedStaff':
      return option.lastName + ', ' + option.firstName;
      break;
      default:
      console.error("Error in creating option string for: " + property);
    }
  }



}]);