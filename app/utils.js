'use strict'

angular.module('utils',[])
.factory('dataFormats', function(){

  var commaSeparatedNumber = function(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
  }

  return{

  //returns string in the form $12,234,121.13 or -$234,233.00
  money: function(decimalAmount, truncate){
    if(decimalAmount == null){
      return '$0.00';
    }
    var num = parseFloat(decimalAmount).toFixed(2);
    var numParts = num.split('-');

    if(numParts.length>1){
      numParts[0]='-$';
    }else{
      numParts.splice(0,0,'$'); 
    }
    var numParts2 = numParts[1].split('.');
    var integer = parseInt(numParts2[0]);
    numParts2[0] = commaSeparatedNumber(integer);
    numParts[1] = numParts2.join('.');
    num = numParts.join("");


    if(truncate){
      numParts = num.split('.');
      num = numParts[0];
    }
    return num;
  },

  text: function(text){
    return text;
  },
  textarea: function(text){
    return text;
  },
  number: function(number){
    return number;
  },
  select: function(select){
    return select;
  },
  percent: function(percent){
    if(isNaN(percent)){percent=0};
    return parseFloat(percent).toFixed(0).concat(' %'); 
  },
  date: function(date){
    return date
  },
  bool: function(bool){
    return bool
  },
  table: function(table){
    return table
  }

}

})


//allows for string reference to properties in nested objects
//eg getProperty($scope, "project.federalGrantAssignments[2].grantYear")
//returns $scope.project.federalGrantAssignments[2].grantYear
.factory('parser', function(){
  return {
    getProperty: function(obj, prop) {
      var parts = prop.split('.'),
      last = parts.pop(),
      l = parts.length,
      i = 1,
      current = parts[0];

      while((obj = obj[current]) && i < l) {
        current = parts[i];
        i++;
      }

      if(obj) {
        return obj[last];
      }
    }
  }
})

.factory('styleHelper', function(){
  return {
    fullPageScroll : function(className){
      $('document').ready(function(){
        var wHeight = $(window).height();
        $(className).css({
          'height' : wHeight + 'px'   
        }); 
      });
    }
  }
})


.factory('log', function(){
  return{
    dir: function(object, label){
      if(typeof console.groupCollapsed === 'function' && typeof console.groupEnd === 'function' && label){
        console.groupCollapsed(label);
      }
        console.dir(object);
      if(typeof console.groupCollapsed === 'function' && typeof console.groupEnd === 'function' && label){
        console.groupEnd(label);
      } 
      
    },
    group: function(label, collapsed){
      if(typeof console.group=== 'function' && !collapsed){
        console.group(label);
      }else if(typeof console.group=== 'function'){
        console.groupCollapsed(label);
      }
    },
    groupEnd: function(label){
      if(typeof console.groupEnd=== 'function'){
        console.groupEnd(label);
      }
    }
  }
})



;