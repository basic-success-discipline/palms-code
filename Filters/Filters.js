(function () {
    'use strict';
    var filters = angular.module('palmFilters', []);
    filters.filter('startsWithFirst', function () {
        return function (inputArray, startsWith, limit) {
            limit = limit || inputArray.length;
            var i = 0,
                lowerVal = startsWith.toLowerCase(),
                results = [],
                itm = '';
            angular.forEach(inputArray, function (item) {
                if (item.toLowerCase().indexOf(lowerVal) === 0) {
                    results.push(item);
                }
            });
            if (results.length < limit) {
                for (i = 0; i < inputArray.length; i++) {
                    itm = inputArray[i];
                    if (itm.toLowerCase().indexOf(lowerVal) > 0) {
                        results.push(itm);
                        if (results.length >= limit) {
                            break;
                        }
                    }
                }
            }
            return results;
        };
    });
}());