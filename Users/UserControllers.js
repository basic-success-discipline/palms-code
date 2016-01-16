(function () {
    'use strict';
    var UserControllers = angular.module('UserControllers', []);
    UserControllers.controller('userListCtrl', ['$scope', '$stateParams', '$modal', '$location', '$filter', '$http', 'roleAccess', 'dialogService', '$rootScope', 'UserResource',
        function ($scope, $stateParams, $modal, $location, $filter, $http, roleAccess, dialogService, $rootScope, userResource) {

            $scope.selectedUsers = [];

            $scope.gridOptions = {
                data: 'myData',
                showSelectionCheckbox: 'true',
                selectedItems: $scope.selectedUsers,
                multiSelect: true,
                keepLastSelected: false,
                enableColumnResize: true,
                columnDefs: [{ field: 'firstName', displayName: 'First Name', width: '150px' },
                    { field: 'lastName', displayName: 'Last Name', width: '150px' },
                    { field: 'email', displayName: 'Email', width: '180px' },
                    { field: 'authentications[0].isApproved', displayName: 'Account Enabled', width: '150px' },
                    { field: 'title', displayName: 'Title', width: '170px' },
                    { field: 'authentications[0].lastLoginDate', displayName: 'Last Login', cellFilter: 'date:\'MM/dd/yyyy \'' }],
                filterOptions: { filterText: '', useExternalFilter: false },
                showFilter: true
            };

            var getUsers = function () {
                $scope.loadingItems = true;
                $scope.users = userResource.getList(function (data) {
                    $scope.loadingItems = false;
                });
                $scope.myData = $scope.users;
            };
           
            
            var loadData = function () {
                getUsers();

            };

            loadData();

            $scope.message = "";
            $scope.open = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'Users/AddUser.html',
                    controller: 'addUserCtrl',
                });
                modalInstance.result.then(function (user) {
                    if (user !== null) {
                        $scope.message = user.firstName + " " + user.lastName + " has been added.";
                        dialogService.popup('info', 'Users', $scope.message);
                        getUsers.push(user);
                    }
                });
            };


            $scope.disabled = function () {
                if ($scope.userGroups.length === 0) {
                    return 'disabled';
                }
            };
            $scope.styleRow = function (value) {
                if (value === false) {
                    return "isDisabled-row";
                }
            };

            $scope.message = "";
            $scope.open = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'Users/AddUser.html',
                    controller: 'addUserCtrl',
                });
                modalInstance.result.then(function (user) {
                    if (user !== null) {
                        $scope.message = user.firstName + " " + user.lastName + " has been added.";
                        dialogService.popup('info', 'Users', $scope.message);
                        getUsers();
                    }
                });
            };
            
          
            var removedCounter = 0;
            var toRemoveCounter = 0;
            var doRemoveUser = function (accUser) {
                $scope.message = 'Removing ' + (removedCounter - 0 + 1) + ' of ' + toRemoveCounter + ' Users';
                dialogService.popup('info', 'Users', $scope.message);

            };
            var removeUsers = function () {

                //what should we do here.  I do not think we want to really remove the user record? Maybe it should just disable the account
                return;

                if ($scope.selectedUsers.length > 0) {
                    var invite = $scope.selectedUsers.pop();
                    doRemoveUser(invite);
                } else {

                    $scope.message = (removedCounter > 1)
                        ? removedCounter + ' users were removed.'
                        : removedCounter + ' user was removed.';
                    removedCounter = 0;
                    toRemoveCounter = 0;
                    dialogService.popup('info', 'Users', $scope.message);
                }
            };
            $scope.deleteSelected = function () {
                var msg = ($scope.selectedUsers.length > 1)
                    ? "Are you sure you want to remove the selected users?"
                    : "Are you sure you want to remove the selected user?";
                if (confirm(msg)) {
                    toRemoveCounter = $scope.selectedUsers.length;
                    removeUsers();
                }
            };
            $scope.editSelected = function () {
                if ($scope.selectedUsers.length > 0) {
                    $location.path('/users/' + $scope.selectedUsers[0].userId);
                }
            };

           

        }]);
    UserControllers.controller('addUserCtrl', ['$scope', '$modalInstance', 'UserResource', 'RoleResource', '$http', '$rootScope', 'dialogService',
        function ($scope, $modalInstance, UserResource, RoleResource, $http, $rootScope, dialogService) {
            $scope.errorMessage = "";
            $scope.roles = [];
            $scope.userModel = {
                "firstName": "",
                "lastName": "",
                "email": "",
                "roleId": null
            };
            $scope.userRole = {
                roleId: '',
                userId: '',
            };
            $scope.roles = RoleResource.getAllowableRoles();

            var addFailure = function (resp) {
                $scope.errorMessage = $scope.errorMessage = resp.data.exceptionMessage;
                dialogService.popup('error', 'Add New User', $scope.errorMessage);
            };

            var closeModal = function (newUser) {
                $modalInstance.close(newUser);
            };
            var userSuccess = function (user) {
                var roleId = $scope.userModel.roleId;
                $scope.userRole.userId = user.userId;
                $scope.userRole.roleId = roleId;
                RoleResource.saveUserRole($scope.userRole, function () {
                    UserResource.sendNewUserEmail({ userId: user.userId, roleId: roleId }, closeModal(user), function (error) {
                        dialogService.popup('info', 'Add New User', user.firstName + ' ' + user.lastName + ' successfully Added');
                    }, function (error) {
                        dialogService.popup('error', 'Add New User', error.data.message);

                    });
                });
            };

            var userFailure = function (resp) {
                dialogService.popup('error', 'Add New User', resp.data.message);
            };
            $scope.ok = function () {
                UserResource.save($scope.userModel, userSuccess, userFailure);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }]);
    UserControllers.controller('registerUserCtrl', ['$scope', 'UserResource', '$stateParams', 'dialogService', 'PasswordResource', '$q', '$location',
       function ($scope, UserResource, $stateParams, dialogService, PasswordResource, $q, $location) {
           $scope.user = {};
           $scope.pwdModel = {
               userId: '',
               newPwd: '',
               newPwdRepeat: '',
               token: ''
           };

           PasswordResource.passwordReset({ userId: $stateParams.userId, token: $stateParams.token }, function (response) {
               if ($stateParams.token != response.token) {
                   $location.path('login');
               }
           });

           UserResource.getRegistrationUser({ id: $stateParams.userId, token: $stateParams.token }, function (response) {
               $scope.user = response;
               $scope.pwdModel.userId = response.userId;
           }, function (response) {
               $scope.errorMessage = response.statusText;
               dialogService.popup('error', 'Register New User', $scope.errorMessage);
           });

           $scope.pwdValidationCheck = function (isValid) {
               $scope.RegistrationForm.Password.$setValidity('test', isValid);
           };


           var setPassword = function () {
               var deferred = $q.defer();
               PasswordResource.changePassword( $scope.pwdModel ,function(){
                       deferred.resolve(true);
                   },function (data) {
                       deferred.reject(data.statusText);
                       $scope.errorMessage = data.statusText;
                       dialogService.popup('error', 'Register New User', $scope.errorMessage);
                   });
               return deferred.promise;
           };
           var updateUser = function () {
               var deferred = $q.defer();
               UserResource.registerUser({ id: $scope.user.userId, token: $stateParams.token }, $scope.user, function (response) {
                   deferred.resolve(true);
               }, function () {
                   $scope.errorMessage = 'Unable to update user.';
                   dialogService.popup('error', 'Register New User', $scope.errorMessage);
                   deferred.reject('Unable to update user.');
               });
               return deferred.promise;
           };

           var saveUser = function () {
               $q.all([updateUser(), setPassword()])
               .then(function () {
                   dialogService.popup('info', 'Register New User', 'Registration Complete, login to access your projects');
                   $location.path('login');
               });
           };

           $scope.register = function () {
               if ($scope.RegistrationForm.$valid) {
                   saveUser();
               }
           };
       }]);
    UserControllers.controller('userRoleDetailCtrl', ['$scope', '$stateParams', '$modalInstance', 'RoleResource', 'roles', 'userId', 'dialogService',
        function ($scope, $stateParams, $modalInstance, RoleResource, existingRoles, userId, dialogService) {
            $scope.errorMessage = "";
            $scope.roles = [];
            $scope.selectedRole = null;
            $scope.selectedRole = {
                roleId: null,
            };
            $scope.userRole = {
                roleId: '',
                userId: userId,
            };


            var getRoles = function () {
                $scope.roles = RoleResource.getAllowableRoles(function (roles) {
                    for (var i = 0; i < existingRoles.length; i++) {
                        for (var j = 0; j < roles.length; j++) {
                            if (roles[j].roleName == existingRoles[i].roleName) {
                                $scope.roles.splice(j, 1);
                            }
                        }
                    }
                });
            };

            getRoles();
            $scope.ok = function () {
                if ($scope.selectedRole !== null && $scope.selectedRole.roleId !== null) {
                    $scope.userRole.roleId = $scope.selectedRole.roleId;
                    RoleResource.saveUserRole($scope.userRole, function (result) {
                        $modalInstance.close(result);
                    }, function (error) {

                    });
                }
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            }
        }]);
    UserControllers.controller('userProfileCtrl', ['$scope', 'UserResource', 'StateResource', '$filter', 'PhoneResource', 'AddressResource', '$rootScope', 'dialogService', '$q','ComponentLookUpResource',
        function ($scope, UserResource, StateResource, $filter, PhoneResource, AddressResource, $rootScope, dialogService, $q, ComponentLookUpResource) {

            var newOfficeAddress = function () {
                var newAddr = {
                    "addressId": 0,
                    "addressTypeId": 0,
                    "address1": "",
                    "address2": "",
                    "city": "",
                    "state": "",
                    "postalCode": "",
                };

                ComponentLookUpResource.getByName({ categoryName: 'AddressType', componentName: 'Office' }, function (data) {
                    newAddr.addressTypeId = data.componentLookUpId;
                    $scope.officeAddress = newAddr;
                })
            },
            createPhoneObj = function (type, phoneNumber) {
                return {
                    phoneNumberId: 0,
                    phoneTypeId: 0,
                    number: phoneNumber || '',
                    phoneType: {
                        componentLookUpId: 0,
                        componentName: type
                    }
                };
            },

            savePhones = function () {
                if ($scope.UserProfileForm.officeNumber.$dirty) {
                    if ($scope.officePhone.phoneNumberId > 0) {
                        PhoneResource.update({ objectId: $scope.userId, objectType: 'User' }, $scope.officePhone);
                    } else {
                        PhoneResource.save({ objectId: $scope.userId, objectType: 'User' }, $scope.officePhone);
                    }
                }
                if ($scope.UserProfileForm.faxNumber.$dirty) {
                    if ($scope.faxPhone.phoneNumberId > 0) {
                        PhoneResource.update({ objectId: $scope.userId, objectType: 'User' }, $scope.faxPhone);
                    } else {
                        PhoneResource.save({ objectId: $scope.userId, objectType: 'User' }, $scope.faxPhone);
                    }
                }
                if ($scope.UserProfileForm.mobileNumber.$dirty) {
                    if ($scope.mobilePhone.phoneNumberId > 0) {
                        PhoneResource.update({ objectId: $scope.userId, objectType: 'User' }, $scope.mobilePhone);
                    } else {
                        PhoneResource.save({ objectId: $scope.userId, objectType: 'User' }, $scope.mobilePhone);
                    }
                }
                $scope.UserProfileForm.$setPristine();
            },
            saveAddress = function () {
                if ($scope.officeAddress.addressId > 0) {
                    AddressResource.update({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, $scope.officeAddress);
                } else {
                    AddressResource.save({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, $scope.officeAddress, function (newAddr) {
                        $scope.officeAddress = newAddr;
                    });
                }
            },
            loadData = function () {

                $scope.user = UserResource.getCurrentUser({ include: '' }, function (user) {
                    $scope.userId = user.userId;

                    var roleNames = [], entityNames = [];

                    $scope.roleList = roleNames.join(', ');
                   
                    var oAddress = AddressResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, function (officeAddress) {
                        if (0 <= officeAddress.length && officeAddress[0] == null) {
                            newOfficeAddress();
                        }
                        else {
                            $scope.officeAddress = oAddress[0];
                        }
                    });

                    var oPhone = PhoneResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, function (officePhone) {
                        if (0 <= officePhone.length && officePhone[0] == null) {
                            $scope.officePhone = createPhoneObj('Office');
                        }
                        else {
                            $scope.officePhone = oPhone[0];
                        }
                    });
                    var fPhone = PhoneResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Fax' }, function (fax) {
                        if (0 <= fax.length && fax[0] == null) {
                            $scope.faxPhone = createPhoneObj('Fax');
                        }
                        else {
                            $scope.faxPhone = fPhone[0];
                        }
                    });
                    var mPhone = PhoneResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Work Mobile' }, function (mobile) {
                        if (0 <= mobile.length && mobile[0] == null) {
                            $scope.mobilePhone = createPhoneObj('Work Mobile');
                        }
                        else {
                            $scope.mobilePhone = mPhone[0];
                        }
                    });
                });

            };
            $scope.roleList = '';
            $scope.userId = 0;

            $scope.showLoader = false;
            $scope.officeAddress = {};
            $scope.user = {};
            $scope.officePhone = {};
            $scope.faxPhone = {};
            $scope.mobilePhone = {};


            loadData();
            $scope.getStates = function (val) {
                return StateResource.get({ stateName: val }).$promise.then(function (resp) {
                    var states = [];
                    angular.forEach(resp, function (state) {
                        states.push(state.stateName);
                    });
                    var filtered = $filter('startsWithFirst')(states, val, 12);
                    return filtered;
                });
            };


            $scope.ok = function () {
                if ($scope.UserProfileForm.$dirty) {
                    UserResource.update($scope.user, function (data) {
                        //update of user was successful, save the phone numbers...
                        savePhones();
                        saveAddress();

                        dialogService.popup('info', 'Profile', 'Your profile has been updated.');
                    });
                }
            };


        }]);
    UserControllers.controller('userDetailCtrl', ['$scope', '$stateParams', 'UserResource', '$filter', 'PhoneResource', 'AddressResource', 
      '$location', '$modal', 'RoleResource', '$q', 'dialogService', 'ComponentLookUpResource','StateResource',
       function ($scope, $stateParams, UserResource, $filter, PhoneResource, AddressResource, 
                  $location, $modal, RoleResource, $q, dialogService, ComponentLookUpResource, StateResource) {
           $scope.file = "";
           $scope.showLoader = false;
           $scope.roles = [];
           $scope.selectedRoles = [];
           $scope.message = "";
           $scope.officePhone = {};
           $scope.officeAddress = {};
           $scope.userId = $stateParams.userId;

           $scope.enableText = 'Disable'

           var newOfficeAddress = function () {
               var newAddr = {
                   "addressId": 0,
                   "addressTypeId": 0,
                   "address1": "",
                   "address2": "",
                   "city": "",
                   "state": "",
                   "postalCode": "",
               };

               ComponentLookUpResource.getByName({ categoryName: 'AddressType', componentName: 'Office' }, function (data) {
                   newAddr.addressTypeId = data.componentLookUpId;
                   $scope.officeAddress = newAddr;
               })
           };

           var createPhoneObj = function (type, phoneNumber) {
               return {
                   phoneNumberId: 0,
                   phoneTypeId: 0,
                   number: phoneNumber || '',
                   phoneType: {
                       componentLookUpId: 0,
                       componentName: type
                   }
               };
           };

           $scope.tabAccLabel = "Contact";
           $scope.tabPermissionLabel = "Roles and Status";

           $scope.gridRoleOptions = {
               data: 'myRoleData',
               multiSelect: true,
               keepLastSelected: false,
               enableColumnResize: true,
               columnDefs: [
                    { cellTemplate: '<div class="ngSelectionCell ng-scope"><input type="checkbox" ng-model="row.entity.role" ng-click="toggle(row.entity,row)" ng-disabled="row.entity.enabled"></div>', width: '25px' },
                   { field: 'roleName', displayName: 'Role', groupable: true, cellEditableCondition: 'enabled' },
               ],
               filterOptions: { filterText: '', useExternalFilter: false },
               showFilter: true
           };

           $scope.toggle = function (role, row) {
               if (row.selected) {
                   $scope.selectedRoles.pop(role);
                   row.selcted = false;
               }
               else {
                   $scope.selectedRoles.push(role);
                   row.selcted = true;
               }

           }

           var getUser = function () {
               UserResource.get({ userId: $stateParams.userId, include: 'UserRoles,UserRoles.Role,Authentications' }, function (user) {
                   $scope.user = user;

                   $scope.enableText = user.authentications[0].isApproved == true ? "Disable" : "Enable";

                   for (var i = 0; i < $scope.user.userRoles.length; i++) {
                       $scope.roles.push({
                           roleId: $scope.user.userRoles[i].roleId,
                           roleName: $scope.user.userRoles[i].role.roleName,
                       });
                   }
                   $scope.myRoleData = $scope.roles;
                   
                   var oAddress = AddressResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, function (officeAddress) {
                       if (0 <= officeAddress.length && officeAddress[0] == null) {
                           newOfficeAddress();
                       }
                       else {
                           $scope.officeAddress = oAddress[0];
                       }
                   });

                   var oPhone = PhoneResource.get({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, function (officePhone) {
                       if (0 <= officePhone.length && officePhone[0] == null) {
                           $scope.officePhone = createPhoneObj('Office');
                       }
                       else {
                           $scope.officePhone = oPhone[0];
                       }
                   });
               });
           };

           getUser();


           $scope.disableEnable = function () {
               var action = $scope.enableText == 'Enable'? 'EnableUser': 'DisableUser';
               UserResource.enableDisableUser({ userId: $scope.userId, action: action }, function (data) {
                   dialogService.popup('info', 'User', 'User Account ' + ($scope.enableText == 'Enable' ? 'Enabled' : 'Disabled'));
                   $scope.enableText = $scope.enableText == 'Enable' ? 'Disable' : 'Enable';
               }, function (error) {
                   dialogService.popup('error', 'User', 'Failure - ' + error.data.exceptionMessage);
               })
           }

           var removeRoleCounter = 0;
           var removeRole = function (role) {
               var deferred = $q.defer();

               RoleResource.removeUserRole({ userId: $scope.userId, roleId: role.roleId }, function (result) {
                   $scope.roles.splice($scope.roles.indexOf(role), 1);
                   deferred.resolve(true);
               });
               return deferred.promise;
           };
           var doRemoveRole = function (role) {
               $scope.message = 'Removing ' + role.roleName;
               dialogService.popup('info', 'User', $scope.message);
               var promise = removeRole(role);
               promise.then(function () {
                   $scope.remove();
               });
           };
           $scope.remove = function () {
               if ($scope.selectedRoles.length > 0 && $scope.roles.length > 1) {
                   var role = $scope.selectedRoles.pop();
                   removeRoleCounter++;
                   doRemoveRole(role);
               } else {
                   $scope.message = (removeRoleCounter > 1)
                       ? removeRoleCounter + ' roles were removed'
                       : removeRoleCounter + ' role was removed';
                   $scope.message = (removeRoleCounter == 0)
                       ? 'User must always have 1 role.'
                       : $scope.message;
                   removeRoleCounter = 0;
                   dialogService.popup('info', 'User', $scope.message);
               }
           };

           $scope.open = function () {
               var modalInstance = $modal.open({
                   templateUrl: 'Users/UserRoleDetail.html',
                   controller: 'userRoleDetailCtrl',
                   resolve: {
                       roles: function () {
                           return $scope.roles;
                       },
                       userId: function () {
                           return $stateParams.userId;
                       }
                   }
               });
               modalInstance.result.then(function (result) {
                   $scope.roles.push({
                       roleId: result.roleId,
                       roleName: result.role.roleName,
                   });
               });
           };

        
           $scope.getStates = function (val) {
               return StateResource.get({ stateName: val }).$promise.then(function (resp) {
                   var states = [];
                   angular.forEach(resp, function (state) {
                       states.push(state.stateName);
                   });
                   var filtered = $filter('startsWithFirst')(states, val, 12);
                   return filtered;
               });
           };

           var savePhones = function () {
               if ($scope.UserDetailForm.officeNumber.$dirty) {
                   if ($scope.officePhone.phoneNumberId > 0) {
                       PhoneResource.update({ objectId: $scope.userId, objectType: 'User' }, $scope.officePhone);
                   } else {
                       PhoneResource.save({ objectId: $scope.userId, objectType: 'User' }, $scope.officePhone);
                   }
               }
               $scope.UserDetailForm.$setPristine();
           },
            saveAddress = function () {
                if ($scope.officeAddress.addressId > 0) {
                    AddressResource.update({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, $scope.officeAddress);
                } else {
                    AddressResource.save({ objectId: $scope.userId, objectType: 'User', type: 'Office' }, $scope.officeAddress, function (newAddr) {
                        $scope.officeAddress = newAddr;
                    });
                }
            };
           $scope.ok = function (isDirty) {
               if (isDirty == true) { 
                   UserResource.update($scope.user, function (data) { 
                       //update of user was successful, save the phone numbers...
                       savePhones();
                       saveAddress();
                       $location.path('/users');
                       dialogService.popup('info', 'User', 'User information updated');
                   });
               }
           };
       }]);

}());