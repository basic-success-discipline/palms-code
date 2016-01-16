
(function () {
    'use strict';
    var pwdStrDirectives = angular.module('pwdStrDirectives', []);
    pwdStrDirectives.directive('palmsPasswordStrength', ['SystemSettingsResource',
        function (SystemSettingsResource) {
            var createReqConfig = function (setting) {
                var intValue = parseInt(setting.settingValue, 10);
                switch (setting.settingName) {
                    case 'NumberUpper':
                        if (setting.settingValue > 0) {
                            return {
                                id: setting.systemSettingId,
                                label: 'Must contain ' + setting.settingValue + ' uppercase letter' + ((intValue > 1) ? 's' : ''),
                                isValid: false,
                                reg: /[A-Z]/g,
                                minMatch: intValue
                            };
                        }
                        break;
                    case 'NumberSymbol':
                        if (setting.settingValue > 0) {
                            return {
                                id: setting.systemSettingId,
                                label: 'Must contain ' + setting.settingValue + ' special character' + ((intValue > 1) ? 's' : ''),
                                isValid: false,
                                reg: /\W/g,
                                minMatch: intValue
                            };
                        }
                        break;
                    case 'NumberNumeric':
                        if (setting.settingValue > 0) {
                            return {
                                id: setting.systemSettingId,
                                label: 'Must contain ' + setting.settingValue + ' number' + ((intValue > 1) ? 's' : ''),
                                isValid: false,
                                reg: /\d/g,
                                minMatch: intValue
                            };
                        }
                        break;
                    case 'PwdMinLength':
                        if (setting.settingValue > 0) {
                            return {
                                id: setting.systemSettingId,
                                label: 'Must be at least ' + setting.settingValue + ' character' + ((intValue > 1) ? 's' : ''),
                                isValid: false,
                                validate: function (val) {
                                    return val && val.length >= intValue;
                                }
                            };
                        }
                        break;
                    case 'PwdMaxLength':
                        //                    if (setting.settingValue > 0) {
                        //                        return {
                        //                            id: setting.systemSettingId,
                        //                            label: 'Must have fewer than ' + setting.settingValue + ' character' + ((intValue > 1) ? 's' : ''),
                        //                            isValid: true,
                        //                            validate: function (val) {
                        //                                return (!val) || val.length < intValue;
                        //                            }
                        //                        };
                        //                    }
                        break;
                }
                return false;
            };
            return {
                restrict: 'EA',
                templateUrl: 'Security/PasswordStrength.html',
                scope: {
                    title: '@',
                    password: '=',
                    onValidationCheck: '&'
                },
                isValid: true,
                link: function ($scope) {
                    $scope.$watch('password', function (a, b, c) {
                        var pwd = $scope.password;
                        var allValid = true;
                        angular.forEach($scope.strengthRequirements, function (req) {
                            if (req.reg) {
                                //create a new regular expression object each time so the matching starts at the beginning...
                                var newRegEx = new RegExp(req.reg);
                                req.isValid = (newRegEx.exec(pwd) !== null) && pwd.match(newRegEx).length >= req.minMatch;
                                allValid = allValid && req.isValid;
                            } else if (req.hasOwnProperty('validate')) {
                                req.isValid = req.validate(pwd);
                                allValid = allValid && req.isValid;
                            }
                        });
                        $scope.onValidationCheck({ isValid: allValid });
                    });
                },
                controller: function ($scope, $element, $attrs) {
                    $scope.strengthRequirements = [];
                    $scope.systemSettings = SystemSettingsResource.getPublicList({ id: 'PasswordStrength' }, function (settings) {
                        angular.forEach(settings, function (setting) {
                            if (setting.settingType === 'PasswordStrength') {
                                var req = createReqConfig(setting);
                                if (req) {
                                    $scope.strengthRequirements.push(req);
                                }
                            }
                        });
                    });
                    $scope.getClass = function (isValid) {
                        return (isValid === true) ? 'alert-success' : 'alert-danger';
                    };
                }
            };
        }]);
}());