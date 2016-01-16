'use strict';
var dataResource = angular.module('dataResource', ['ngResource']);
// dataResource.baseUrl = '';
 // dataResource.baseUrl = 'http://localhost:49463';
// dataResource.baseUrl = 'http://192.168.10.93:49463';
dataResource.baseUrl = 'http://192.168.10.93:49464';

dataResource.constant('baseUrl', dataResource.baseUrl );

