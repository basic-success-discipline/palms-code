var app = angular.module('palmsApp',
	[

       
        'dataResource',
        'duScroll',
        'nav',
        'ngResource',
        'ngRoute',
        'palmsSecurity',
        'palmFilters',
        'PasswordControllers',
        'projects',
        'parties',
        'pwdStrDirectives',
        'reports',
        'RoleControllers',
        'toaster',
        'ui.bootstrap',
        'ui.router',
        'ui.utils',
        'UserControllers',
        'utils',
        'localytics.directives',
        'palmsDirectives',
        'modals',
        'uimaskmoney',
        'fcsa-number',
        'ngFileUpload',
        'monospaced.elastic',
        'contacts',
        'ngMockE2E'
        
	]);


app.config(['$provide', function($provide) {

        //displays negative numbers with '-' instead of in parentheses (angular mask default)
        $provide.decorator('$locale', ['$delegate', function($delegate) {
          $delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-\u00A4';
          $delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = '';

          return $delegate;
        }]);
      }]);

// app.config(['$httpProvider', function ($httpProvider) {
//     $httpProvider.interceptors.push(['$q', '$location', '$window',   function ($q, $location, $window) {
//         return {
//             'responseError': function (response) {
//                 if (response.status == 401 || (response.status ==0 && $window.navigator.userAgent.indexOf('MSIE 10') > 0)) {
//                      if (response.config.url.indexOf("UserInfo") == -1) {
//                         if ($location.$$path.indexOf("login") == -1) {
//                             $location.path('/login');
//                         }
//                     }
//                 }
//                 return $q.reject(response);
//             }
//         }
//     }]);
   
// }]);

app.config(['fcsaNumberConfigProvider', function(fcsaNumberConfigProvider) {
  fcsaNumberConfigProvider.setDefaultOptions({
    preventInvalidInput: true
  });
}]);




app.config(["membershipProvider", "loginNavigationProvider", "baseUrl", function (membership, loginNav, baseUrl) {
    // membership.membershipUrl = "http://localhost:49463" + "/API/Session";
    membership.membershipUrl = baseUrl + "/API/Session";
    loginNav.successPath = "/";
}]);

app.config(['roleAccessProvider', 'baseUrl', function (roleAccessProvider, baseUrl) {
    // roleAccessProvider.endpoint = "http://localhost:49463" + "/API/UserPermission";
    roleAccessProvider.endpoint = baseUrl + "/API/UserPermission";
}]);

app.run(['$rootScope', '$location', '$filter', '$state', '$window',
    function ($rootScope, $location, $filter,  $state, $window) {
        $rootScope.$state = $state;
       
        $rootScope.searchObjectArray = function (myArray, myObject) {
            for (var i = 0; i < myArray.length; i++) {
                if (myArray[i] === myObject) {
                    return i;
                }
            }
            return -1;
        };

        //hide navigation bar for some screens
        //maybe I should have designed the app so that I don't have to do this here, but c'est la vie
        $rootScope.showNav = $location.path() == '/create_loan_documents' ? false : true;


        // //for debuggin initial sign on issues
        // $window.localStorage.removeItem("palmsAuthToken");
        // console.dir($window.localStorage);



        $rootScope.loginSuccessState = "home";
        $rootScope.loginSuccessStateParams = "";

        // $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        //     var unsecuredStates = [
        //         "login",
        //         "passwordReset",
        //         "passwordResetSent",
        //         "passwordResetResult",
        //         "changePassword",
        //         "newUserRegistration"
        //     ];
           
        // });

        // $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        //     if (toState.name === 'login') {
        //         if (fromState.name.length > 0) {
        //             if (fromState.name === 'newUserRegistration' || fromState.name === 'changePassword' || fromState.name === 'passwordResetResult') {
        //                 $rootScope.loginSuccessState = "home";
        //                 $rootScope.loginSuccessStateParams = "";
        //             }
        //             else {
        //                 $rootScope.loginSuccessState = fromState.name;
        //                 $rootScope.loginSuccessStateParams = fromParams;
        //             }
        //         }
        //     }

        //     if (toState.name.length > 0 && toState.name != 'login') {
        //         $rootScope.loginSuccessState = toState.name;
        //         $rootScope.loginSuccessStateParams = toParams;
        //     }

        //     var simpleStateName = ((toState.name || "").split('.') || [''])[1];
        //     if (simpleStateName != undefined && simpleStateName.length) {
        //         var toTitleCase = function (str) {
        //             str = str.replace(/([A-Z])/g, ' $1');
        //             return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        //         };
        //         $rootScope.CurrentView = toState.viewName || toTitleCase(simpleStateName);
        //     }
        //     else {
        //         $rootScope.CurrentView = toState.name;//("Home");
        //     }
        // });

        // $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
        //     var msg = ("Error when transitioning from state '{{fromName}}' to state '{{toName}}'.\n\n{{error}}",
        //                 { fromName: fromState.name, toName: toState.name, error: error });
        //     console.log(msg);
        // });

       
        // $rootScope.logout = function () {
        //     $rootScope.currentUser = null;
        //     if (membership.logout) {
        //         membership.logout()
        //             .finally(function () {
        //                 $location.path('/login');
        //                 window.location.reload();
        //             })
        //     } else {
        //         $location.path('/login');
        //     }
        // };

    }]);

// This will add '$safeApply' method to the root scope
// Safe apply is just a helper method so that you can call where needed and it will
// ensure the digest/apply process is not already executing
angular.module('ng')
    .config(function ($provide) {

        var safeApply = function () {
            var $scope, fn, force = false;
            if (arguments.length == 1) {
                var arg = arguments[0];
                if (typeof arg == 'function') {
                    fn = arg;
                }
                else {
                    $scope = arg;
                }
            }
            else {
                $scope = arguments[0];
                fn = arguments[1];
                if (arguments.length == 3) {
                    force = !!arguments[2];
                }
            }
            $scope = $scope || this;
            fn = fn || function () {
            };
            if (force || !$scope.$$phase) {
                $scope.$apply ? $scope.$apply(fn) : $scope.apply(fn);
            }
            else {
                fn();
            }
        };

        $provide.decorator('$rootScope', function ($delegate) {
            $delegate.$safeApply = safeApply; //executionTimer(safeApply, '$safeApply');
            return $delegate;
        });

        function executionTimer(pointer, tag) {
            return function () {
                var start = Date.now();
                var value = pointer.apply(this, arguments);
                var end = Date.now();
                console.info(tag + ": " + (end - start) + "ms");
                return value;
            }
        }
    });