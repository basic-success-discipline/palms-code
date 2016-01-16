(function () {
    'use strict';
    var PasswordControllers = angular.module('PasswordControllers', []);
    PasswordControllers.controller('changePasswordCtrl', ['$scope', '$location', '$stateParams',
        'SystemSettingsResource', 'PasswordResource', 'dialogService',
        function ($scope, $location, $stateParams, SystemSettingsResource, PasswordResource, dialogService) {
            $scope.pwdModel = {
                userId: $stateParams.userId,
                currentPwd: '',
                newPwd: '',
                newPwdRepeat: '',
                token: $stateParams.token
            };
            $scope.errorMessage = '';
            $scope.show = true;
            if ($scope.pwdModel.token !== "0") {
                debugger;
                $scope.show = false;
                PasswordResource.passwordReset({ userId: $stateParams.userId, token: $stateParams.token }, function (response) {
                }, function (response) {
                    $location.path('/password-reset-result/invalidToken');
                });
            }
            $scope.pwdValidationCheck = function (isValid) {
                $scope.ChangePasswordForm.newPwd.$setValidity('test', isValid);
            };
            var goBackToUserProfile = function () {
                $location.path('/user-profile');
            };
            $scope.ok = function () {
                if ($scope.ChangePasswordForm.$valid) {
                    PasswordResource.changePassword($scope.pwdModel, function () {
                        if ($scope.pwdModel.token !== "0") {
                            $location.path('/password-reset-result/success');
                        } else {
                            dialogService.popup('info', 'Change Password', 'Your password has been successfully changed.');
                            goBackToUserProfile();
                        }
                    }, function (response) {
                        $scope.errorMessage = response.exceptionMessage || response.data.exceptionMessage;
                        dialogService.popup('error', 'Change Password', $scope.errorMessage);
                    });
                }
            };
            $scope.cancel = function () {
                if ($scope.pwdModel.token !== "0") {
                    $location.path("/login");
                } else {
                    goBackToUserProfile();
                }
            };
        }]);
    PasswordControllers.controller('passwordResetCtrl', ['$scope', '$http', '$location', 'dialogService','PasswordResource',
        function ($scope, $http, $location, dialogService, PasswordResource) {
        $scope.email = "";
        $scope.errorMessage = "";

        $scope.submit = function () {
            if ($scope.PasswordResetForm.$valid) {
                PasswordResource.passwordResetRequest({ userEmail: $scope.email }, null, function (response) {
                    $location.path('/password-reset-sent/' + $scope.email);
                }, function (error) {
                    $scope.errorMessage = error.data.exceptionMessage;
                    dialogService.popup('error', 'Password Reset', $scope.errorMessage);
                });
            }
        };
    }]);
    PasswordControllers.controller('passwordResetResultCtrl', ['$scope', '$http', '$location', '$stateParams',
       function ($scope, $http, $location, $stateParams) {
           $scope.message = "";
           $scope.success = false;
           $scope.failure = false;

           if ($stateParams.result === "success") {
               $scope.url = '#!/login';
               $scope.linkText = "Sign-in";
               $scope.message = "Your password was successfully set.";
               $scope.success = true;
           } else {
               $scope.url = '#!/password-reset';
               $scope.linkText = "Reset Password";
               $scope.message = "Your password reset link has expired.  Please try resetting your password again.";
               $scope.failure = true;
           }
       }]);
}());