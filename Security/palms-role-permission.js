
(function () {
    'use strict';
    angular.module("palmsApp").directive('palmsRolePermission', ['roleAccess', '$rootScope', function (roleAccess, $rootScope) {
        var linker = function ($scope, $elem, $attrs) {
            
            var group = $attrs.palmsPermissionGroup || '';
            var permission = $attrs.palmsRolePermission || '';
            var behavior = $attrs.palmsPermissionBehavior || 'disable';


            roleAccess.hasAccess(permission, group).then(function (canDo) {

                if (canDo === false) {
                    if (behavior === 'disable') {
                        if ($elem.disable) {
                            $elem.disable();
                            return;
                        }
                        $elem.attr('disabled', 'disabled');
                    } else if (behavior === 'hide') {
                        $elem.hide();
                    }
                }
            });

        };
        return {
            restrict: 'A',
            replace: false,
            link: linker,
            scope: {
                permissionClientId: '=',
                permissionGroup: '@',
                behavior: '@'
            }
        };
    }]);
}());
