angular.module('palmsDirectives', [])


.directive('pageStatus', function(){
  return{
    restrict: 'E',
    scope:{
      begun: '=',
      complete: '='
    },
    templateUrl: 'Directives/page_status.html'
  }
})

.directive('dateInput', ['$filter', function($filter){
  return{
    restrict: 'AC',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelController) {
      ngModelController.$parsers.push(function(data) {
        //View -> Model
        return data;
      });
      ngModelController.$formatters.push(function(data) {
        //Model -> View
        return $filter('date')(data, "MMM d, yyyy");
        // return $filter('date')(data, "yyyy-MM-dd");
      });
    }
  }
}])

.directive('dateInputTwo', ['$filter', function($filter){
  return{
    restrict: 'AC',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelController) {
      ngModelController.$parsers.push(function(data) {
        //View -> Model
        return data;
      });
      ngModelController.$formatters.push(function(data) {
        //Model -> View
        // return $filter('date')(data, "MMM d, yyyy");
        return $filter('date')(data, "MM/dd/yy");
      });
    }
  }
}])
  ;