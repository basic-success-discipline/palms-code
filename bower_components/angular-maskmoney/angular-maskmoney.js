'use strict';

angular.module('uimaskmoney', []).directive('uiMaskmoney', function($filter) {
  return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, elem, attr, ngModel) {
         elem.maskMoney();

         function decimalRex(dChar) {
            return RegExp("\\d|\\-|\\" + dChar, 'g');
         }

         function clearRex(dChar) {
            return RegExp("\\-{0,1}((\\" + dChar + ")|([0-9]{1,}\\" + dChar + "?))&?[0-9]{0,2}", 'g');
         }

         function clearValue(value) {

            var val = String(value);
            var dSeparator = attr['decimal'];
            var cleared = null;

            if (RegExp("^-[\\s]*$", 'g').test(val)) {
               val = "-0";
            }

            if (decimalRex(dSeparator).test(val)) {
               cleared = val.match(decimalRex(dSeparator)).join("").match(clearRex(dSeparator));
               cleared = cleared ? cleared[0].replace(dSeparator, ".") : null;
            }

            return cleared;
         }

         function currencySymbol() {
            return attr['prefix'];
         }

         ngModel.$parsers.push(function (viewValue) {
            var cVal = clearValue(viewValue);
            return parseFloat(cVal);
         });

         elem.on("blur", function () {
            elem.val($filter('currency')(ngModel.$modelValue, currencySymbol()));
         });

         ngModel.$formatters.unshift(function (value) {
            return $filter('currency')(value, currencySymbol());
         });
      }
  };
});
