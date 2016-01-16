'use strict';

angular.module('projects')


.controller('project.amortizationCtrl', ['$scope', '$rootScope', '$state', 'projectsResource', 'navPath', 'projectData', 'log', function($scope, $rootScope, $state, projectsResource, navPath, projectData, log) {

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
    alert("THERE HAS BEEN AN ERROR!\nYou may be viewing the wrong data!\nPlease contact the developer.");
    console.error({"Project Id" : $scope.project.projectId, "State Param": $state.params.projectId});
  }
  // END GET BASIC PROJECT


  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Amortization";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
      log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP





  $scope.nav = navPath.nav.paths.Projects.nav.paths['Loan Amortization'].nav;
  $scope.paths = $scope.nav.paths;
  $scope.current = $scope.nav.current;
  if($state.current.name=="project.amortization"){
    $state.go($scope.nav.paths[$scope.nav.current].state);
  }
  navPath.updateCurrentDeep('state', $scope.current, navPath.nav);


  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){ 
    if($state.current.name=="project.amortization"){
      $state.go($scope.nav.paths[$scope.nav.current].state);
    }
  });


  $scope.sideMenuShowing = true;
  $scope.toggleSideMenu = function(){
    $scope.sideMenuShowing = !$scope.sideMenuShowing 
  }
  
}]);