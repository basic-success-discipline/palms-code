'use strict';
var dataResource = angular.module('dataResource');

dataResource.factory('RoleResource', ['$resource', function ($resource) {

    return $resource(dataResource.baseUrl + '/api/Role', {}, {
        getList: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '' }, isArray: false },
        save: { method: 'POST', url: dataResource.baseUrl + '/api/Role/AddRole' },
        getAllowableRoles: { method: 'GET', url: dataResource.baseUrl + '/api/Role/AllowableRoles', isArray: true },
        getSystemRoleList: { method: 'GET', url: dataResource.baseUrl + '/api/Role/SystemRoles', isArray: true },
        getCustomRoleList: { method: 'GET', url: dataResource.baseUrl + '/api/Role/CustomRoles', isArray: true },

        getRolePermissionList : {method: 'GET', url: dataResource.baseUrl + '/api/RolePermission/', params: {roleId:''}, isArray: true},
        getPermissionGroupList: { method: 'GET', url: dataResource.baseUrl + '/api/PermissionGroup/', isArray: true },
        saveRolePermission: { method: 'POST', url: dataResource.baseUrl + '/api/RolePermission', params: { roleId: '' } },
        removeRolePermission: {method: 'DELETE', url: dataResource.baseUrl + '/api/RolePermission', params: {roleId: '', id: ''}},

        getAllowableRolesByRole: { method: 'GET', url: dataResource.baseUrl + '/api/RoleAllowableRole', params: { roleId: '' }, isArray: true },
        saveRoleAllowableRole: { method: 'POST', url: dataResource.baseUrl + '/api/RoleAllowableRole', params: { roleId: '' } },
        removeRoleAllowableRole: {method: 'DELETE', url: dataResource.baseUrl + '/api/RoleAllowableRole', params: { roleId: '', id: ''}},

        saveUserRole: { method: 'POST', url: dataResource.baseUrl + '/api/Role/AddUserRole' },
        removeUserRole: { method: 'DELETE', params: {userId: '', roleId: ''}, url: dataResource.baseUrl + '/api/Role/DeleteUserRole' }
    });
}]);