
(function () {
    "use strict";

    angular.module("palmsSecurity", [])
        .constant("PALMS_AUTH_TOKEN_HEADER_KEY", "palms-auth-token")
        .constant("PALMS_AUTH_TOKEN_STORAGE_KEY", "palmsAuthToken")
        .factory("authTokenInterceptor", [
            "PALMS_AUTH_TOKEN_HEADER_KEY",
            "PALMS_AUTH_TOKEN_STORAGE_KEY",
            "$window",
            "$rootScope",
            function (PALMS_AUTH_TOKEN_HEADER_KEY, PALMS_AUTH_TOKEN_STORAGE_KEY, $window, $rootScope) {
                return {
                    request: function (config) {
                        var localStorage = $window.localStorage;
                        config.headers[PALMS_AUTH_TOKEN_HEADER_KEY] = localStorage.getItem(PALMS_AUTH_TOKEN_STORAGE_KEY);
                        return config;
                    }
                };
            }
        ])
        .config(["$httpProvider", function ($httpProvider) {
            $httpProvider.interceptors.push("authTokenInterceptor");
        }])
        .provider("membership", function () {
            var provider = this;

            this.$get = [
                "PALMS_AUTH_TOKEN_STORAGE_KEY",
                "$http",
                "$q",
                "$window",
                "$rootScope",
                function (PALMS_AUTH_TOKEN_STORAGE_KEY, $http, $q, $window, $rootScope) {
                    return {
                        login: function (details) {
                            var deferred = $q.defer();

                            var query = "?emailAddress=" + $window.encodeURIComponent(details.emailAddress) +
                                "&password=" + $window.encodeURIComponent(details.password) +
                                "&persistent=" + details.persistent;
                            $http({
                                method: "GET",
                                url: provider.membershipUrl + query
                            })
                                .success(function (data) {
                                    $window.localStorage.setItem(PALMS_AUTH_TOKEN_STORAGE_KEY, data.token);
                                    $rootScope.$broadcast("security:auth-success");
                                    deferred.resolve(data);
                                })
                                .error(deferred.reject);

                            return deferred.promise;
                        },
                        logout: function () {
                            var deferred = $q.defer();
                            $http({
                                method: 'DELETE',
                                url: provider.membershipUrl
                            })
                                .success(function () {
                                    $window.localStorage.removeItem(PALMS_AUTH_TOKEN_STORAGE_KEY);
                                    deferred.resolve();
                                })
                                .error(deferred.reject);
                            return deferred.promise;
                        }
                    };
                }
            ];
        })
        .provider("loginNavigation", function () {
            this.$get = ["$location", "$rootScope", function ($location, $rootScope) {
                var provider = this;
                return {
                    success: function () {
                        $rootScope.$state.go($rootScope.loginSuccessState, $rootScope.loginSuccessStateParams);
                    }
                };
            }];
        })
        .controller("LoginCtrl", [
            "$scope",
            "membership",
            "loginNavigation",
            function ($scope, membership, loginNavigation) {
                var process = $scope.process = function (details) {
                    delete process.error;
                    process.executing = true;
                    membership.login(details)
                        .then(function () { loginNavigation.success(); })
                        .catch(function (error) { process.error = error; })
                        .finally(function () { delete process.executing; });
                };
            }
        ])
        .provider("roleAccess", function () {
            var provider = this;
            this.$get = ['$q', '$http', '$timeout', function ($q, $http, $timeout) {
                var queryCache = {},
                    getHasAccess = function (permissionName, permissionGroupData) {
                        var find = permissionGroupData.filter(function (item) {
                            return item.permissionName === permissionName;
                        });
                        return (find.length > 0);
                    },
                    getHasAccessPromise = function (permissionName, permissionGroupData) {
                        var deferred = $q.defer();
                        $timeout(function () {
                            deferred.resolve(getHasAccess(permissionName, permissionGroupData));
                        }, 1);
                        return deferred.promise;
                    };
                return {
                    hasAccess: function (permissionName, permissionGroup) {
                        // A common use of this function is when a page loads, a bunch of things will be asking if the user has access to a permission
                        // that will all be part of the same permission group.  These queries will all come in before the first one has a chance to query the endpoint
                        // and get the list of available actions.  To avoid hitting the server for each of the permissions that can be resolved in one query,
                        // we need to do some tricky promise handling and caching.
                        var deferred = $q.defer(),
                            url = provider.endpoint + '?permissionGroup=' + permissionGroup;

                        if (queryCache.hasOwnProperty(url)) {
                            var cacheItem = queryCache[url];
                            //If the results for this combination of items has been cached, we can return a promise that resolves right away
                            if (angular.isArray(cacheItem)) {
                                return getHasAccessPromise(permissionName, cacheItem);
                            }
                            //if the cacheItem isn't an array, it is the promise from a request identical to the one we would need to hit now
                            // so, listen for that promise to be successful then resolve this function's promise based on the results of the query.
                            cacheItem.success(function (data) {
                                queryCache[url] = data;
                                deferred.resolve(getHasAccess(permissionName, data));
                            }).error(function (errResponse) {
                                queryCache[url] = [];
                                deferred.resolve(false);
                            });
                            return deferred.promise;
                        }

                        //if we are still here, we need to look it up and cache the promise so other requests for the same group can hook up to it and
                        // get resolve the correct promise with the result set.
                        queryCache[url] = $http({
                            url: url,
                            method: 'GET'
                        })
                            .success(function (data) {
                                queryCache[url] = data;
                                deferred.resolve(getHasAccess(permissionName, data));
                            })
                            .error(function (errResponse) {
                                queryCache[url] = [];
                                deferred.resolve(false);
                            });
                        return deferred.promise;
                    }
                };
            }];
        });
})();