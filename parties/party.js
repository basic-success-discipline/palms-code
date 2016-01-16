'use strict';

angular.module('parties')


//store metadata about current project
.factory('partyData', ['$rootScope','$state', function($rootScope, $state){
  var partyId, party, currentView = $state.current.name;
  if($state.current.name =='party'){
    currentView ='party.details'
  }
  return{
    partyId: partyId,
    party: party,
    currentView: currentView

  }
}])




//project controller
.controller('partyCtrl', ['$scope', '$state', '$resource','$q', 'baseUrl', 'partyData', 'dataFormats', 'log', function($scope, $state, $resource, $q, baseUrl, partyData, dataFormats, log) {





  $scope.partyId = $state.params.partyId;
  if(!$scope.partyId){
    $state.go('parties');
    return;
  }

   //set up logging group
   var loggingGroup = "Party " + $scope.partyId;
   log.group(loggingGroup);

   $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });



  //get basic project from get request
  var include = [
  ];
  var resources = {
    party: $resource(baseUrl + '/api/ whatever it is', {}, {
      getByPartyId: { method: 'GET', params:{include: include.join(), partyId: $scope.partyId}, isArray: false} 
    })
  };


  loadData();
  function loadData(){
    $scope.loading=true;
    var requests =[

    // resources.party.getByPartyId(function(results){
    //   $scope.party = results;
    //   log.dir($scope.party, "Party");
    //   partyData.party = $scope.party;
    // }).$promise

    ];

    //When all requests are run
    $q.all(requests).then(function(data){
      $scope.loading=false;
      //go to current subview
      $state.go(partyData.currentView);
    });
  }

  
}]);
