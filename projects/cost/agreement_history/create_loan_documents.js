'use strict';

angular.module('projects')


.controller('create_loan_documentsCtrl', ['$scope', '$state', '$resource', '$q', '$window', 'baseUrl', 'lookupAPI', 'log', 'projectData', 'modals', function($scope, $state, $resource, $q, $window, baseUrl, lookupAPI, log, projectData, modals) {

 //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Create Loan Documents";
  log.group(loggingGroup);

  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP


  $scope.projectId = $state.params.projectId;
  $scope.actionId = $state.params.actionId;
  $scope.copyActionId = angular.copy($scope.actionId);




///////////////
  // LOAD DATA //
  ///////////////


  //define your resources
  var resources = {

    //created Document Details if none are created already
    //gets collection of document details
    getDocumentDetails: $resource(baseUrl + '/api/AgreementHistoryAction/GetAgreementActionDetailsByHistoryId', {}, {
      get: { method: 'GET', params: {id:'@id', include: ''}, isArray: true}
    }), 


    //for copy from document dropdown
    getAgreementHistory: $resource(baseUrl + '/api/AgreementHistoryAction/GetByProjectId', {}, {
      get: { method: 'GET', params: { projectId: $scope.projectId, include: 'actionType,loanDocuments'}, isArray: true}
    }),

    // gets document types with requirements from database
    getDocumentTypes: $resource(baseUrl + '/api/Document/GetDocumentRequiredFields', {}, {
      get: { method: 'GET', params: {documentName: ''}, isArray: true}
    }),

    //resets default details, and returns new collection of document details
    resetDefault: $resource(baseUrl + '/api/AgreementHistoryAction/ResetDetails', {}, {
      get: { method: 'GET', params: { agreementHistoryActionId: $scope.actionId}, isArray: true}
    }),

    //saves collection of document details
    saveDocumentDetails: $resource(baseUrl + '/api/AgreementHistoryAction/UpdateAgreementActionDetailCollection', {}, {
      put: { method: 'PUT', isArray:true}
    }),

    createDocument: $resource(baseUrl +'/api/Document/CreateLoanDocument', {}, {
      get: { method: 'GET', params: {agreementHistoryActionId: $scope.actionId, userName: ''}, isArray:true} 
    }),

    getDocumentDependencies: $resource(baseUrl +'/api/Document/GetDocumentDependencies', {}, {
      get: { method: 'GET', isArray:false} 
    })


};




  //load the data
  loadData();
  function loadData(){
    $scope.loading=true;
    //define what requests you want to run

    var requests;
    requests = [

      //get collection of document details for this project
      resources.getDocumentDetails.get({id: $scope.copyActionId},function(results){
        $scope.docDetails = results;
        // log.dir($scope.docDetails, 'Document Details');
        $scope.processDocDetails('load'); //stick docDetails into an object called doc
      }).$promise
      ]

    //When all requests are run
    $q.all(requests).then(function(data){

      $scope.unsavedChanges = false;
      $scope.loading=false;
    });
  }

  $scope.loadData = loadData;
  // END LOAD DATA


  /////////////////
  // GET LOOKUPS //
  /////////////////
  


  var lookupRequests = [

  resources.getAgreementHistory.get(function(results){
    $scope.agreementHistory = results;
    for(var i=0; i<$scope.agreementHistory.length; i++){
      if($scope.agreementHistory[i].loanDocuments.length==0){
        $scope.agreementHistory.splice(i, 1);
        i--;
      }
    }
    angular.forEach($scope.agreementHistory, function(action){
      
    })
    log.dir($scope.agreementHistory, 'Agreement History');
  }).$promise,

  resources.getDocumentTypes.get(function(results){
    $scope.docTypesArray = results;
    $scope.docTypes = {}, $scope.docIds={};
    angular.forEach($scope.docTypesArray, function(docType){
      $scope.docTypes[angular.copy(docType.documentName)] = docType;
      $scope.docIds[angular.copy(docType.documentId)] = docType;
    })
    $scope.docTypesSelectArray = Object.keys($scope.docTypes);
    log.dir($scope.docTypes, 'Document Types');
  }).$promise,

  resources.getDocumentDependencies.get(function(results){
    $scope.docDeps = results.documentDependencies;
    $scope.depVals = results.dependencyValues;
    log.dir($scope.docDeps, 'Document Dependencies');
    log.dir($scope.depVals, 'Dependency Values');
  }).$promise
  ]

  //When all requests are run
  $q.all(lookupRequests).then(function(data){
  });
  

  //enumerate lookups needed
  var lookups = [

  //for various entry fields
  'system_description',
  'observation_schedule',
  'withholding_percentage',
  'primary_repayment_source',
  'secondary_repayment_source',
  'governmental_frequency_of_repayment',
  'nongovernmental_frequency_of_repayment',
  'loan_category',
  'dsr_requirements',
  'fund_requirements',
  'excise_tax_definition',
  'disadvantaged_rate_type',
  'security_level',
  'type_of_guarantor',
  'debt_consent'

  ];

  //go get 'em
  lookupAPI.doConcurrentLookups(lookups).then(function(data){
    $scope.lookups = data;
    $scope.governmental = true;
    if($scope.governmental){
      $scope.lookups['frequency_of_repayment'] = $scope.lookups['governmental_frequency_of_repayment'];
    }else{
      $scope.lookups['frequency_of_repayment'] = $scope.lookups['nongovernmental_frequency_of_repayment'];
    }

    log.dir($scope.lookups, 'Lookups');
  })
  // END GET LOOKUPS


  /////////////////////
  // CREATE DOCUMENT //
  /////////////////////


  $scope.saveDetailsAndCreateDocument = function(){

    if ($scope.validateRequiredFields()){

      $scope.processDocDetails('confirm');
      $scope.confirmEdits(function(){



        log.group("Saving document details and creating document");
        $scope.processDocDetails('save');




        log.dir($scope.docDetails, "Document details being used to create document");
        var saveRequests = [
        resources.saveDocumentDetails.put($scope.docDetails, function(results){
          console.log( "Document details were successfully saved!");
          $scope.createDocument();

        }, function(error){
          modals.alert({head:"Document details save failed", body:"See console for details"});
          console.error("Document details save failed.");
          console.error(error);
        }).$promise
        ]



    //when all requests are complete
    $q.all(saveRequests).then(function(data){
      console.log("All document creation requests complete");
      log.groupEnd("Saving document details and creating document");
      $scope.justSaved = true;
    });
  })
}else{
  modals.alert({head:'Document details save failed', body:'You did not provide values for all the required fields to create this document'});
}
}


$scope.createDocument = function(){
  log.dir($scope.documentType, "Document Type to be created");
  var createRequests = [
  resources.createDocument.get({groupName : $scope.docType}, function(results){
    console.log( "Document was successfully created!");
    $scope.returnedDocs = results;
    if($scope.viewDocument){
      $scope.viewDocuments();
    }
  }, function(error){
    modals.alert({head:"Document creation failed", body:"See console for details"});
    console.error("Document creation failed.");
    console.error(error);
  }).$promise
  ]



    //when all requests are complete
    $q.all(createRequests).then(function(data){
      console.log(data);
      
    });
  }

  // END CREATE DOCUMENT



 ///////////////////////////////
  // UPDATE ACTION ON RECORD //
  ///////////////////////////////

  $scope.updateAction = function(columnName){

    //this is specific to this page because of the data structure
    $scope.ensureDetailExists(columnName);
    var actionObject = $scope.doc[columnName];

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




  ////////////////////////////
  // DOWNLOAD DOCUMENT FILE //
  ////////////////////////////

  $scope.viewDocuments = function(){

    if($scope.returnedDocs){
      angular.forEach($scope.returnedDocs, function(rDoc){
        $scope.viewDocument(rDoc);
      })
    }
    else{
      modals.alert({head: 'Document view failed', body:"You have not created any documents to view!"});
    }
  }
  $scope.viewDocument = function(doc){
    $window.open(baseUrl + doc.relativePath.replace('~', ''), '_blank');
  }

  // END DOWNLOAD DOCUMENT FILE



  ////////////////////////////
  // RESET DEFAULT DOCUMENT //
  ////////////////////////////

  $scope.resetDefault = function(){
    $scope.loading=true;
    //define what requests you want to run
    var requests;
    requests = [
    resources.resetDefault.get(function(results){
      console.log("Document Details reset to default!");

      $scope.docDetails = results;
        // log.dir($scope.docDetails, 'Document Details');
        $scope.processDocDetails('load');

      }).$promise
    ]

    //When all requests are run
    $q.all(requests).then(function(data){
      $scope.loading=false;
    });
  }

//END RESET DEFAULT DOCUMENT




//transforms 
$scope.processDocDetails = function(arg){

  switch (arg){
    case 'load':
    $scope.doc = {};
    angular.forEach($scope.docDetails, function(docDetail){
      docDetail.alreadyExists=true;
      var trueValueStrings = ['True', 'Yes'];
      var falseValueStrings = ['False', 'No', 'No Requirement'];
        docDetail.columnValue = trueValueStrings.indexOf(docDetail.columnValue)!=-1 ? true : (falseValueStrings.indexOf(docDetail.columnValue)!=-1 ? false : docDetail.columnValue);//account for all data being saved as text
        $scope.doc[docDetail.columnName] = docDetail;
        $scope.doc[docDetail.columnName].alreadyExists = true;

      })
    log.dir($scope.doc, 'Document');  
    break;
    case 'confirm':
    $scope.confirmFields = {};
    angular.forEach($scope.doc, function(value, key){
      if(value.action=='edit'){
        value.changeInProject = true;
        $scope.confirmFields[key] = value;
      }
    })
    break;
    case 'confirmed':
    angular.forEach($scope.confirmFields, function(value, key){
      $scope.docDetails[key] = value;
    })
    break;
    case 'save':
    $scope.docDetails = [], $scope.confirmFields = [];
    angular.forEach($scope.doc, function(value, key){
      $scope.docDetails.push(value);
    });
    break;

    default:
    console.log("Could not process Document details");
  } 
}

$scope.confirmEdits = function(callback){
  console.dir($scope.confirmFields);
  if(Object.keys($scope.confirmFields).length>0){
    modals.confirmEditsCLD({
      projectId: $scope.projectId,
      fields: $scope.confirmFields,
      ok: function(fields){
        $scope.confirmFields = fields;
        $scope.processDocDetails('confirmed');
        callback();
      },
      cancel: function(){
        return false;
      }
    })
  }else{
    callback();
  }
}


$scope.updateRequiredFields = function(){
  var loggingGroup = "Updating required fields with doc dependency";
  try{
    $scope.requiredFieldUpdateError = false;
  log.group(loggingGroup, true);
  var docTypeDepId = $scope.docDeps.filter(function( obj ) {
    return obj.dependencyName == "DocumentType";
  })[0].documentDependencyId;

  $scope.docId = $scope.runDocDependencies(docTypeDepId, $scope.docType);
  console.log($scope.docId);
  }
  catch (exception){
    $scope.requiredFieldUpdateError = true;
  }
  finally{
    log.groupEnd(loggingGroup);
  }
}

$scope.runDocDependencies = function(id, value){
  console.log(id, value);
  var branch = $scope.depVals.filter(function( obj ) {
    return obj.parentDocumentDependencyId == id && $scope.compareDocDeps(obj.value, value, obj.operator);
  })[0];

  console.dir(branch);
  if(branch.documentId){
    return branch.documentId;
  }
  else{
    var depName = $scope.docDeps.filter(function( obj ) {
      return obj.documentDependencyId == branch.documentDependencyId;
    })[0].dependencyName;
    console.log(depName);
    return $scope.runDocDependencies(branch.documentDependencyId, $scope.doc[depName]);
  }
}

$scope.compareDocDeps = function(compareValue, value, operator){
  if(value==undefined || value==null){
    return true;
  }
  switch (operator){
    case "GreaterThan":
      return value > compareValue;
    break
    case "LessThan":
      return value < compareValue;
    break
    case "EqualTo":
      return value == compareValue;
    break
    case "GreaterThanEqualTo":
      return value >= compareValue;
    break
    case "LessThanEqualTo":
    return value <= compareValue;
    break
    case "NotEqualTo":
    return value != compareValue;
    break
    case null:
    return value == compareValue;
    break
    default:
    console.log("Unknown operator: " + operator)
  }
}

//process details that don't exist yet in the DB so that they canb be added
$scope.ensureDetailExists = function(columnName){

  if(!$scope.doc[columnName].alreadyExists){

    var columnValue = angular.copy($scope.doc[columnName].columnValue);
    $scope.doc[columnName] = {
      action: 'add',
      agreementActionDetailId: null,
      agreementHistoryActionId: $scope.actionId,
      alreadyExists: true,
      columnName: columnName,
      columnValue: columnValue
    }
  }
}



//is the detail required for the current documentType?

$scope.detailHighlight = function(columnName){
  var classes = [];
  if($scope.detailRequired(columnName)){
    classes.push('required-highlight');
    if(!$scope.doc[columnName] || !$scope.doc[columnName].columnValue){
      classes.push('empty');
    }
  }else if($scope.detailOptional(columnName)){
    classes.push('optional-highlight');
  }
  return classes;
}


$scope.requiredFields = {}
$scope.detailRequired = function(columnName){
  if($scope.docId){
    var required = false;
    angular.forEach($scope.docIds[$scope.docId].requiredFields, function(field){
      if(field.mergedFieldName == columnName && field.isRequired){
        required = true;
        $scope.requiredFields[columnName] = true;
      }
    })
  }
  return required;
}

$scope.detailOptional = function(columnName){
  if($scope.docId){
    var optional = false;
    angular.forEach($scope.docIds[$scope.docId].requiredFields, function(field){
      if(field.mergedFieldName == columnName && !field.isRequired){
        optional = true;;
      }
    })
  }
  return optional;
}

$scope.validateRequiredFields = function(){
  var valid = true;
  angular.forEach($scope.requiredFields, function(value, key){
    if($scope.doc[key] == null || $scope.doc[key].columnValue == null || $scope.doc[key].columnValue == ''){
      console.log("Missing field: " + $scope.doc[key].columnValue);
      valid = false;
    }
  })
  return valid;
}




//formatting name displayed in dropdowns
$scope.optionString = function(property, option){
  switch (property){
    case 'copyFrom':
    return option.actionType.componentName;
    break;

    console.error("Error in creating option string for: " + property);
  }
}



}])








.directive('cldPanel', function(){
  return {
    restrict: 'A',
    transclude: true,
    scope: { title:'@' },
    templateUrl: 'projects/cost/agreement_history/cld_panel.html'
  };
})
;