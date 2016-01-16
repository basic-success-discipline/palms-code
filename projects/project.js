'use strict';

angular.module('projects')


//store metadata about current project
.factory('projectData', ['$rootScope','$state', function($rootScope, $state){
  var projectId, project, currentView = $state.current.name, currentPaymentRequestNumber;
  if($state.current.name =='project'){
    currentView ='project.details'
  }
  return{
    projectId: projectId,
    project: project,
    currentView: currentView,
    currentPaymentRequestNumber: currentPaymentRequestNumber

  }
}])




//project controller
.controller('projectCtrl', ['$scope', '$state', '$resource','$q', 'baseUrl', 'projectData', 'dataFormats', 'styleHelper', 'log', function($scope, $state, $resource, $q, baseUrl, projectData, dataFormats, styleHelper, log) {





  $scope.projectId = $state.params.projectId;
  if(!$scope.projectId){
    $state.go('projects');
    return;
  }

   //set up logging group
   var loggingGroup = "Project " + $scope.projectId;
   log.group(loggingGroup);

   $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });



  //get basic project from get request
  // var include = ['fundprogram'];
  var include = [
    'Recipient' ,
    'FundingProgram',
  ];
  var resources = {
    project: $resource(baseUrl + '/api/Project', {}, {
      getByProjectId: { method: 'GET', params:{include: include.join(), projectId: $scope.projectId}, isArray: false} //takes param projectId
    })
  };


  loadData();
  function loadData(){
    $scope.loading=true;
    var requests =[

    resources.project.getByProjectId(function(results){
      $scope.project = results;


      $scope.project.loanAmount = $scope.project.amount_to_obligate;
      
      //amount_to_obligate would be populate by funding sources, but since we don't have that screen now,
      //I don't have a value for it. Hardcoding for now.
      $scope.project.loanAmount = 1000000; 

      log.dir($scope.project, "Project");
      projectData.project = $scope.project;
    }).$promise

    ];

    //When all requests are run
    $q.all(requests).then(function(data){
      
      $scope.loading=false;

      //go to current subview
      $state.go(projectData.currentView);
    });
  }



  //static pane functions
  $scope.keys = ['party_name', 'project_name', 'project_number','agreement_number','agreement_history','assigned_staff', 'loan_amount', 'amount_disbursed', 'balance_available', 'forgivable_principal', 'remaining_forgivable_principal', 'interest_rate'];
  $scope.format = function(value, type){
    if(value != null && type != null){
      return dataFormats[type](value);
    }
  }

  $scope.togglePane = function(bool){
    $scope.openPane = bool;
  }

  styleHelper.fullPageScroll('.project.static-pane .scrollable');


  $scope.openContacts = function (testRow) {
    var row = {contactId: testRow};
    $window.open("/#!/contacts?projectId=" + $scope.projectId + "&contactId=" + row.contactId, '_blank');
    // $window.open("/#!/contacts?projectId=" + $scope.projectId + "&contactId=" + row.contactId, null, "height=820,width=1024,scrollbars=yes,resizable=yes");
  }


  
}]);
