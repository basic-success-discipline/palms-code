
'use strict';
var dataResource = angular.module('dataResource');
dataResource.factory('lookupResource', ['$http', 'baseUrl', function ($http, baseUrl) {
  //these methods return a function that, when called, make an http request and return the promise
  var lookup = function(property){
    return function(){ return $http.get(baseUrl + '/api/' + property)}
  }
  var componentLookup = function(categoryName){
    return function(){ return $http({url: baseUrl + '/api/ComponentLookUp/GetByCategory', method: "GET", params: {categoryName: categoryName}})};
  }
  

  var lookups = {
    assigned_staff:                 lookup('User'),
    county:                         lookup('County'),
    npdes_permit_number:            lookup('CWSRFNPDESLookup'),
    // waterbody_id:                   lookup('CWSRFWaterBody'),
    grant_year:                     lookup('GrantYear'),
    funding_program:                lookup('FundingProgram'),
    party:                          lookup('Recipient'),
    recipient:                      lookup('Recipient'),
    compliance_status:              componentLookup('Project Compliance Status'),
    system_type :                   componentLookup('Project System Type'),
    legislative_districts:          componentLookup('Legislative District'),
    congressional_districts:        componentLookup('Congressional District'),
    ownership_type:                 componentLookup('DWSRF Benefit Owner Type'),
    contributes_to_water_quality:   componentLookup('Project Improvement Contribution'),
    allows_system_to:               componentLookup('Project Improvement System'),
    affected_waterbody_is:          componentLookup('Project Improvement Water Body'),
    designated_water_use:           componentLookup('Project Improvement Designated Water Use'),
    other_water_use:                componentLookup('Project Improvement Other Water Use'),
    protection:                     componentLookup('Project Improvement Protection'),
    restoration:                    componentLookup('Project Improvement Restoration'),
    nims_categories:                componentLookup('Nim Category'),
    compliance_objectives:          componentLookup('Nim Objective'),
    cost_category:                  componentLookup('Funding Authorization Cost Category'),
    contract_action_type:           componentLookup('Funding Authorization Action'),
    status_of_request:              componentLookup('Funding Authorization Status'),
    admin_completion_status:        componentLookup('Admin Completion Status'),
    disbursement_status:            componentLookup('Disbursement Status'),
    project_status:                 componentLookup('Project Status'),
    repayment_status:               componentLookup('Repayment Status'),
    payment_request_status:         componentLookup('Payment Request Status'),
    cwsrf_needs_category:           componentLookup('CWSRF Benefit Needs Category'),
    agreement_history_action_type:  componentLookup('Agreement History Action Type'),
    green_project:                  componentLookup('Green Project Reserve'),
    system_description:             componentLookup('System Description'),
    observation_schedule:           componentLookup('Observation Schedule'),
    withholding_percentage:         componentLookup('Withholding Percentage'),
    primary_repayment_source:       componentLookup('Primary Repayment Source'),
    secondary_repayment_source:     componentLookup('Secondary Repayment Source'),
    governmental_frequency_of_repayment:  componentLookup('Govermental Frequency of Repayment'),
    nongovernmental_frequency_of_repayment:  componentLookup('Non-Governmental Frequency of Repayment'),
    loan_category:                  componentLookup('Loan Category'),
    dsr_requirements:               componentLookup('Debt Service Reserve Requirements'),
    fund_requirements:              componentLookup('Fund Requirements'),
    excise_tax_definition:          componentLookup('Excise Tax Definition'),
    disadvantaged_rate_type:        componentLookup('Interest Rate Type'),
    interest_rate_type:             componentLookup('Interest Rate Type'),
    security_level:                 componentLookup('Security Level'),
    type_of_guarantor:              componentLookup('Type of Guarantor'),
    debt_consent:                   componentLookup('Debt Consent'),
    admin_fees_based_on:            componentLookup('Admin Fee Type'),
    admin_fees_paid_over:           componentLookup('Admin Fee Paid Over'),
    admin_fees_charged_on:          componentLookup('Admin Charge Fee On'),
    loan_amortization_method:       componentLookup('Loan Amortization Method'),
    assistance_type:                componentLookup('Assistance Type'),
    funding_source:                 componentLookup('Funding Source')


  }

  return lookups;
}])

.factory('lookupAPI', ['$q','lookupResource', function($q, lookupResource){
  return{

    //takes in lookup variable names as string array
    //returns promise of all requests done concurrently
    //which itself returns an object with each property containing its lookup data
    doConcurrentLookups:function(lookups){

      var obj ={}, array=[]
      for(var i =0; i<lookups.length; i++){
        if(typeof lookupResource[lookups[i]] == 'function'){
          var promise = lookupResource[lookups[i]](); //runs the function associated with each lookup, which does the http request
        array.push(promise);
        obj[lookups[i]] = {index: array.length-1};
        }else{
          console.error("could not do lookup for " + lookups[i]);
        }
        
      }
      var qAll = $q.all(array);
      return qAll.then(function(data){
        for(var key in obj){
          if(obj.hasOwnProperty(key)){

            obj[key] = data[obj[key].index].data;
          }
        }
        return obj;
      });
    }
  }
}]);