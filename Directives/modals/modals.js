angular.module('modals', [])


.factory('modals', ['$modal', function($modal){
  return {
    yesNoCancel: function(options){
      var modalInstance = $modal.open({
        templateUrl: 'Directives/modals/yes_no_cancel.html',
        controller: 'yesNoCancelCtrl',
        resolve: {
         options: function(){
          return options;
        }
       }
      });

      modalInstance.result.then(
        function (confirmation) {
          if(confirmation && options.yes){
            options.yes();
          }else if(options.no){
            options.no();
          }
        }, function () {
          if(options.cancel){
            options.cancel();
          };
      });
    },
    alert: function(message){
      var modalInstance = $modal.open({
        templateUrl: 'Directives/modals/alert.html',
        controller: 'alertCtrl',
        resolve: {
         message: function(){
          return message;
        }
       }
      });
    },
    selectWaterbodyId: function(options){
      var modalInstance = $modal.open({
        templateUrl: 'Directives/modals/select_waterbody_id.html',
        controller: 'selectWaterbodyIdCtrl',
        resolve: {
         options: function(){
          return options;
        }
       }
      });

      modalInstance.result.then(
        function (waterbodyId) {
          if(waterbodyId && options.ok){
            options.ok(waterbodyId);
          }
        }, function () {
          if(options.cancel){
            options.cancel();
          };
      });
    },
    uploadFiles: function(options){
      var modalInstance = $modal.open({
        templateUrl:'Directives/modals/upload_files.html',
        controller: 'uploadFilesCtrl',
        resolve:{
          options: function(){
            return options;
          }
        }
      });

      modalInstance.result.then(
        function () {
          if(options.ok){
            options.ok();
          }
        }, function () {
          if(options.cancel){
            options.cancel();
          };
      });
    },
    confirmEditsCLD: function(options){
      var modalInstance = $modal.open({
        templateUrl:'Directives/modals/confirm_edits_cld.html',
        controller: 'confirmEditsCLDCtrl',
        resolve:{
          options: function(){
            return options;
          }
        }
      });

      modalInstance.result.then(
        function (fields) {
          if(options.ok && fields){
            options.ok(fields);
          }
        }, function () {
          if(options.cancel){
            options.cancel();
          };
      });
    }
  }
}])




.controller('yesNoCancelCtrl', ['$scope', '$modalInstance', 'options', function($scope, $modalInstance, options){
  $scope.options = options;
  $scope.yes = function () {
    $modalInstance.close(true);
  };
  $scope.no = function () {
    $modalInstance.close(false);
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}])

.controller('alertCtrl', ['$scope', '$modalInstance', '$sce', 'message', function($scope, $modalInstance, $sce, message){
  $scope.message = message;

  if($scope.message.htmlBody){
    var temp = angular.copy($scope.message.htmlBody)
    $scope.message.htmlBody = $sce.trustAsHtml(temp);
  }

  $scope.ok = function () {
    $modalInstance.close();
  };
}])


.controller('selectWaterbodyIdCtrl', ['$scope', '$modalInstance', '$http', 'options','log', 'baseUrl', function($scope, $modalInstance,$http,  options, log, baseUrl){
  
  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Select Waterbodies";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP

  $scope.waterbodyId = options.waterbodyId;

  $scope.ok = function () {
    $modalInstance.close($scope.waterbody);
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };


  $scope.getRegions = function(){
    $http.get(baseUrl + '/api/CWSRFRegionLookup').then(function(results){
      $scope.regions = results.data;
      log.dir($scope.regions, 'regions');
    });
  }

  $scope.getRegions();

  $scope.getBasins = function(region){
    $http.get(baseUrl + '/api/CWSRFBasinLookup/GetByRegionId?regionId=' + region).then(function(results){
      $scope.basins = results.data;
      log.dir($scope.basins, 'basins');
    });
  }
  $scope.gethucs = function(basin){
    $http.get(baseUrl + '/api/CWSRFHUCLookup/GetByBasinId?basinId=' + basin).then(function(results){
      $scope.hucs = results.data;
      log.dir($scope.hucs, 'hucs');
    });
  }
  $scope.getWaterbodies = function(huc){
    $http.get(baseUrl + '/api/CWSRFWaterbody/GetByHUCId?include=&hucId=' + huc).then(function(results){
      $scope.waterbodies = results.data;
      log.dir($scope.waterbodies, 'waterbodies');
    });
  }

  //formatting name displayed in dropdowns
  $scope.optionString = function(property, option){
    switch (property){
      case 'region':
      return option.regionId + ' | ' + option.regionName;
      break;
      case 'basin':
      return option.basinId + ' | ' + option.basinName;
      break;
      case 'huc':
      return option.hucId + ' | ' + option.hucName;
      break;
      case 'waterbody':
      return option.waterbodyId + ' | ' + option.waterbodyName;
      break;
      default:
      console.error("Error in creating option string for: " + property);
    }
  }
  

}])




.controller('uploadFilesCtrl', ['$scope', '$modalInstance', '$http', 'options','log', 'baseUrl', 'Upload', function($scope, $modalInstance,$http,  options, log, baseUrl, Upload){
  
  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Upload Files";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP

  $scope.files = [];
  
  $scope.ok = function () {
    $modalInstance.close();
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  console.dir(options);

$scope.queueUploads = function(files){
  $scope.uploads={};
  angular.forEach($scope.files, function(file){
    $scope.uploads[file.name] ={
      progress: 0,
      success: null,
      error: null,
      fileName: file.name
    }
  })
}

$scope.upload = function(){
  if ($scope.files && $scope.files.length) {
      for (var i = 0; i < $scope.files.length; i++) {

        Upload.upload({
          url: baseUrl + '/api/Document?agreementHistoryActionId=' + options.agreementHistoryActionId,
          file: $scope.files[i],
          fileName: $scope.uploads[$scope.files[i].name].fileName
        }).progress(function (evt) {
            $scope.uploads[evt.config.file.name].progress = parseInt(100.0 * evt.loaded / evt.total);
            // console.log('progress: ' + $scope.uploads[evt.config.file.name].progress + '% ' + evt.config.file.name);
        }).success(function (data, status, headers, config) {
            $scope.uploads[config.file.name].success = true;
            $scope.uploads[config.file.name].data = data;
            console.log('file ' + config.file.name + 'uploaded. Response: ' + status);
            $scope.uploadsComplete();
        }).error(function (data, status, headers, config) {
            $scope.uploads[config.file.name].error = data;
            console.log('error status: ' + status);
        });
      }
    }
}

$scope.deleteFile  = function(index){
  $scope.files.splice(index, 1);
  console.dir($scope.files);
}

$scope.uploadsComplete = function(){
  var uploaded = true;
  angular.forEach($scope.uploads, function(file){
    file.success ? '' : uploaded = false;
  })
  if(uploaded){
    $scope.uploaded=uploaded;
    $modalInstance.close();
    console.dir($scope.uploads)
  }
}
}])





.controller('confirmEditsCLDCtrl', ['$scope', '$modalInstance',  'options','log',  function($scope, $modalInstance, options, log){
  
  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Confirm Edits";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP

  
  
  $scope.ok = function () {
    $modalInstance.close($scope.options.fields);
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.options = options;
  console.dir(options);

}])




;