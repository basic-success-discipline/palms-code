'use strict';

angular.module('projects')


.controller('project.amortization.loan_scheduleCtrl', ['$scope', '$state', 'log', 'projectData','dataFormats', 'modals', function($scope, $state, log, projectData, dataFormats, modals) {

  
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


$scope.selected = 1;


  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Loan Schedule";
  log.group(loggingGroup);

  $scope.$on("$destroy", function(){
      log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP


$scope.billing = false;
$scope.toggleBilling = function(bool){
  if(bool!=null){
    $scope.billing = bool;
  }else{
    $scope.billing = !$scope.billing;
  }
}


$scope.selectRow = function(row, $event){
  $scope.selected = row;
}


$scope.createBillforSelectedPeriod = function(row){
  modals.alert({head: "Create Bill", body:"Creating bill for row " + row});
}

$(document).keydown(function(e){
    $scope.$apply(function(){
        if (e.keyCode == 38) { 

           $scope.selected--;
        }
        else if (e.keyCode == 40 ) { 
           $scope.selected++;
        }
        else if(e.keyCode == 13){
          $scope.viewSelected($scope.selected);
        }
        })
    });


  $scope.money = function(decimalAmount){
    var money =  dataFormats['money'](decimalAmount);
    return money;
  }

  $scope.percent = function(decimalAmount){
    var percent =  dataFormats['percent'](decimalAmount);
    return percent;
  }




}]);
