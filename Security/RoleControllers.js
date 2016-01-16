(function () {
    'use strict';
    var RoleControllers = angular.module('RoleControllers', []);
    RoleControllers.controller('roleListCtrl', ['$scope', 'RoleResource', '$location', '$modal', 'dialogService', 
        function ($scope, RoleResource, $location, $modal, dialogService) {
            $scope.myData = [];
           
            $scope.myData = RoleResource.getList();
            

            $scope.selectedRoles = [];

         
            $scope.gridOptions = {
                data: 'myData',
                showSelectionCheckbox: 'true',
                selectedItems: $scope.selectedRoles,
                enableColumnResize: true,
                keepLastSelected: false,
               
                multiSelect: false,
                columnDefs: [
                    { field: 'roleName', displayName: 'Role Name', width: '200px' },
                    { field: 'roleDescription', displayName: 'Description' },
                    { field: 'systemRole', displayName: 'System Role', width: '100px' }
                ]
            };


            $scope.createRole = function () {
                $location.path('/roles/0');
            };
            $scope.editSelected = function (readOnly) {
                if ($scope.selectedRoles.length > 0) {
                    $location.path('/roles/' + $scope.selectedRoles[0].roleId);
                }
            };


        }]);
    RoleControllers.controller('roleDetailCtrl', ['$scope', '$stateParams', 'RoleResource', '$location', 'dialogService','$q',
        function ($scope, $stateParams, RoleResource ,$location, dialogService,$q) {
            $scope.message = "";
            var permissionGroup = {};
            $scope.rolePermissions = [];
            $scope.roleAllowableRoles = [];
            $scope.title = "Create Role";
            $scope.permission = "Create Role";
            $scope.role = {
                roleId: $stateParams.roleId,
                roleName: "",
                roleDescription: "",
                systemRole: false
            };
            $scope.groups = [];
            $scope.permissions = [];
            $scope.includedPermissionIds = [];
            $scope.includedRoleIds = [];
            $scope.summaryGroups = {};

            var isEmpty = function (obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key))
                        return false;
                }
                return true;
            };
            var lookForPermissionInGroups = function (permissionId) {
                for (var i = 0; i < $scope.groups.length; i++) {
                    var group = $scope.groups[i];

                    var summaryPermission = group.permissions.filter(function (permission) {
                        return permission.permissionId === permissionId;
                    });
                    if (summaryPermission.length > 0) {
                        return {
                            permissionGroupName: group.groupName,
                            permissionGroupId: group.permissionGroupId, permissionName: summaryPermission[0].permissionName,
                            permissionId: summaryPermission[0].permissionId, uiClass: ''
                        }
                    }

                };
            };
            var addPermissionToSummary = function (permission, isNew) {
                if (typeof permission === 'undefined') {
                    return;
                }
                if (isNew) {
                    permission.uiClass = "permissionAdd";
                } else {
                    permission.uiClass = "permission";
                }
                if ($scope.summaryGroups.hasOwnProperty(permission.appId)) {
                    var app = $scope.summaryGroups[permission.appId];
                    if (app.permissionGroups.hasOwnProperty(permission.permissionGroupName)) {
                        var permissionGroup = app.permissionGroups[permission.permissionGroupName];
                        if (permissionGroup.permissions.hasOwnProperty(permission.permissionId)) {
                            $scope.summaryGroups[permission.appId].permissionGroups[permission.permissionGroupName].permissions[permission.permissionName].uiClass = "permission"
                            return;
                        } else {
                            $scope.summaryGroups[permission.appId].permissionGroups[permission.permissionGroupName].permissions[permission.permissionName] = permission;
                        }
                    } else {
                        var newPermissionGroup = {
                            permissionGroupName: permission.permissionGroupName,
                            permissionGroupId: permission.permissionGroupId,
                            permissions: {}
                        };
                        newPermissionGroup.permissions[permission.permissionName] = permission;
                        $scope.summaryGroups[permission.appId].permissionGroups[permission.permissionGroupName] = newPermissionGroup;
                    }
                } else {
                    var newApp = { appName: permission.appName, appId: permission.appId, permissionGroups: {} };
                    newApp.permissionGroups[permission.permissionGroupName] = {
                        permissionGroupName: permission.permissionGroupName,
                        permissionGroupId: permission.permissionGroupId,
                        permissions: {}
                    };
                    newApp.permissionGroups[permission.permissionGroupName].permissions[permission.permissionName] = permission;
                    $scope.summaryGroups[permission.appId] = newApp;
                }
            };
            var removePermissionFromSummary = function (permission) {
                $scope.summaryGroups[permission.appId].permissionGroups[permission.permissionGroupName].permissions[permission.permissionName].uiClass = "permissionRemove";

            };
            if ($stateParams.roleId !== "0") {
                $scope.title = "Edit Role";
                $scope.permission = "Save Changes";

                RoleResource.get({ id: $stateParams.roleId }, function (role) {
                    $scope.role.roleName = role.roleName;
                    $scope.role.roleDescription = role.roleDescription;
                    $scope.role.systemRole = role.systemRole;

                    RoleResource.getRolePermissionList({ roleId: role.roleId }, function (permissions) {
                        $scope.rolePermissions = permissions;
                        angular.forEach(permissions, function (permission) {
                            $scope.includedPermissionIds.push(permission.permissionId);
                        });

                        RoleResource.getPermissionGroupList(function (groups) {
                            $scope.groups = groups;
                            angular.forEach($scope.includedPermissionIds, function (permissionId) {
                                var group = lookForPermissionInGroups(permissionId);
                                addPermissionToSummary(group, false);
                            });
                        });
                    })

                    RoleResource.getAllowableRolesByRole({ roleId: role.roleId }, function (roleAllowableRoles) {
                        $scope.roleAllowableRoles = roleAllowableRoles;
                        angular.forEach(roleAllowableRoles, function (roleAllowableRole) {
                            $scope.includedRoleIds.push(roleAllowableRole.allowedRoleId);
                        });
                    })

                });
            } else {
                RoleResource.getPermissionGroupList(function (groups) {
                    $scope.groups = groups;
                });
            };
            var removePermissions = [];
            var addPermissions = [];
            var removeRoles = [];
            var addRoles = [];

            $scope.roles = RoleResource.getList();

           

            $scope.visibleGroups = [];

            var handleRoleSelection = function (permission, roleId) {
                if (roleId) {
                    if (permission === 'add' && $scope.includedRoleIds.indexOf(roleId) === -1) {
                        $scope.includedRoleIds.push(roleId);
                    }
                    if (permission === 'add' && addRoles.indexOf(roleId) === -1) {
                        addRoles.push(roleId);
                    }
                    if (permission === 'add' && removePermissions.indexOf(roleId) !== -1) {
                        removeRoles.splice(removeRoles.indexOf(roleId), 1);
                    }
                    if (permission === 'remove' && $scope.includedRoleIds.indexOf(roleId) !== -1) {
                        $scope.includedRoleIds.splice($scope.includedRoleIds.indexOf(roleId), 1);
                    }
                    if (permission === 'remove' && removeRoles.indexOf(roleId) === -1) {
                        removeRoles.push(roleId);
                    }
                    if (permission === 'remove' && addRoles.indexOf(roleId) !== -1) {
                        addRoles.splice(addRoles.indexOf(roleId), 1);
                    }
                    $scope.RoleDetailForm.$dirty = true;
                }
            };

            $scope.includeRole = function ($event, roleId) {
                var permission = ($event.target.checked) ? 'add' : 'remove';
                handleRoleSelection(permission, roleId);
            };

            var handleSelection = function (permission, gAcc) {
                if (gAcc) {
                    if (permission === 'add' && $scope.includedPermissionIds.indexOf(gAcc) === -1) {
                        $scope.includedPermissionIds.push(gAcc);
                        var app = lookForPermissionInGroups(gAcc);
                        addPermissionToSummary(app, true);
                    }
                    if (permission === 'add' && addPermissions.indexOf(gAcc) === -1) {
                        addPermissions.push(gAcc);
                    }
                    if (permission === 'add' && removePermissions.indexOf(gAcc !== -1)) {
                        removePermissions.splice(removePermissions.indexOf(gAcc), 1);
                    }
                    if (permission === 'remove' && $scope.includedPermissionIds.indexOf(gAcc) !== -1) {
                        $scope.includedPermissionIds.splice($scope.includedPermissionIds.indexOf(gAcc), 1);
                        var app = lookForPermissionInGroups(gAcc);
                        removePermissionFromSummary(app);
                    }
                    if (permission === 'remove' && removePermissions.indexOf(gAcc) === -1) {
                        removePermissions.push(gAcc);
                    }
                    if (permission === 'remove' && addPermissions.indexOf(gAcc) !== -1) {
                        addPermissions.splice(addPermissions.indexOf(gAcc), 1);
                    }
                    $scope.RoleDetailForm.$dirty = true;
                }
            };

            $scope.includePermission = function ($event, permissionId) {
                var permission = ($event.target.checked) ? 'add' : 'remove';
                handleSelection(permission, permissionId);
            };

            var findGroup = function (groupId) {
                angular.forEach($scope.groups, function (group) {

                    if (group.permissionGroupId === groupId) {
                        permissionGroup = group;
                        return;
                    }

                });
            };

            $scope.selectGroup = function ($event, groupId) {
                var permission = ($event.target.checked) ? 'add' : 'remove';
                findGroup(groupId);
                angular.forEach(permissionGroup, function (gAcc) {
                    angular.forEach(gAcc, function (object) {
                        handleSelection(permission, object.permissionId);
                    });
                });
            };

            var saveRoleAllowableRole = function (roleAllowableRole) {
                var deferred = $q.defer();
                RoleResource.saveRoleAllowableRole({ roleId: roleAllowableRole.roleId }, roleAllowableRole, function (results) {
                    deferred.resolve(true);
                }, function (error) {
                    deferred.reject(error.statusText);
                    dialogService.popup('error', 'Role Management', error.statusText);
                })
                return deferred.promise;
            };
            var deleteRoleAllowableRole = function (roleAllowableRole) {
                var deferred = $q.defer();
                var oldRoleAllowableRole = $scope.roleAllowableRoles.filter(function (ra) {
                    deferred.resolve(true);
                    return ra.AllowedRoleId === roleAllowableRole.AllowedRoleId;
                });
                if (oldRoleAllowableRole.length < 1) {
                    deferred.resolve(true);
                    return;
                }
                RoleResource.removeRoleAllowableRole({ roleId: roleAllowableRole.roleId, id: oldRoleAllowableRole[0].roleAllowableRoleId }, function (results) {
                    deferred.resolve(true);
                }, function (error) {
                    deferred.reject(error.statusText);
                    dialogService.popup('error', 'Role Management', error.statusText);
                })
                return deferred.promise;
            };
            var saveRolePermission = function (rolePermission) {
                var deferred = $q.defer();
                RoleResource.saveRolePermission({ roleId: rolePermission.roleId }, rolePermission, function (result) {
                    deferred.resolve(true);
                }, function (error) {
                    deferred.reject(error.statusText);
                    dialogService.popup('error', 'Role Management', error.statusText);
                })
                return deferred.promise;
            };
            var deleteRolePermission = function (rolePermission) {
                var deferred = $q.defer();
                var oldRolePermission = $scope.rolePermissions.filter(function (ra) {
                    deferred.resolve(true);
                    return ra.permissionId === rolePermission.permissionId;
                });
                if (oldRolePermission.length < 1) {
                    deferred.resolve(true);
                    return;
                }

                RoleResource.removeRolePermission({ roleId: rolePermission.roleId, id: oldRolePermission[0].rolePermissionId }, rolePermission, function (result) {
                    deferred.resolve(true);
                }, function (error) {
                    deferred.reject(error.statusText);
                    dialogService.popup('error', 'Role Management', error.statusText);
                })
                return deferred.promise;
            };

            var updatePermissions = function (roleId) {
                angular.forEach(removePermissions, function (permission) {
                    var rolePermission = { roleId: roleId, permissionId: permission };
                    deleteRolePermission(rolePermission);

                });
                angular.forEach(addPermissions, function (permission) {
                    var rolePermission = { roleId: roleId, permissionId: permission };
                    saveRolePermission(rolePermission);
                });
            }

            var updateAllowableRoles = function (roleId) {
                angular.forEach(removeRoles, function (allowableRoleId) {
                    var roleAllowableRole = { roleId: roleId, allowedRoleId: allowableRoleId };
                    deleteRoleAllowableRole(roleAllowableRole);
                });
                angular.forEach(addRoles, function (allowableRoleId) {
                    var roleAllowableRole = { roleId: roleId, allowedRoleId: allowableRoleId };
                    saveRoleAllowableRole(roleAllowableRole);
                });
            }

            $scope.ok = function () {

                RoleResource.save($scope.role, function (role) {
                    $q.all([updatePermissions(role.roleId), updateAllowableRoles(role.roleId)])
                    .then(function () {
                      dialogService.popup('info', 'Roles', 'Role successfully saved.');
                      $location.path('/roles');
                    });
                });
            };
            $scope.cancel = function () {
                $location.path('/roles');
            };
        }]);
}());