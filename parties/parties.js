'use strict';

angular.module('parties', [])


.controller('partiesCtrl', ['$scope', '$state',  function($scope, $state) {
  
  $scope.openParty = function(){
    $state.go('party', { partyId: 1 });
  }

}]);