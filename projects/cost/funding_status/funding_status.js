'use strict';

angular.module('projects')


.controller('project.cost.funding_statusCtrl', ['$scope', '$state', 'log', function($scope, $state, log) {


  //set up logging Group
  var loggingGroup = "Funding Status";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
      log.groupEnd(loggingGroup);
  });
}]);