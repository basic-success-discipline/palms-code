'use strict';

angular.module('projects')


.controller('project.detailsCtrl', ['$scope', '$rootScope', '$state', '$document', '$timeout', '$resource', '$q', '$filter', 'baseUrl', 'navPath', 'projectData', 'lookupAPI', 'parser', 'log', 'dataFormats', 'modals', function($scope, $rootScope, $state, $document, $timeout, $resource, $q, $filter, baseUrl, navPath, projectData, lookupAPI, parser, log, dataFormats, modals) {


  ///////////////////////
  // GET BASIC PROJECT //
  ///////////////////////

  projectData.currentView = $state.current.name;
  $scope.project = projectData.project;
  if(!$scope.project){
    $state.go('project');
    return;
  }

  $scope.projectId = $scope.project.projectId;
  if($scope.project.projectId != $state.params.projectId){
    modals.alert({head: "There has been an error!", body:"You may be viewing the wrong data!\n Please contact the developer."});
    console.error({"Project Id" : $scope.project.projectId, "State Param": $state.params.projectId});
  }

  $scope.DW = $scope.project.fundingProgram.program_code == 'DW';
  $scope.CW = $scope.project.fundingProgram.program_code == 'CW';
  $scope.loan = $scope.project.fundingProgram.loan_assistance;
  $scope.grant = !$scope.project.fundingProgram.loan_assistance;

  // END GET BASIC PROJECT


  //////////////////////////
  // SET UP LOGGING GROUP //
  //////////////////////////

  var loggingGroup = "Details";
  log.group(loggingGroup);
  
  $scope.$on("$destroy", function(){
    log.groupEnd(loggingGroup);
  });
  // END SET UP LOGGING GROUP


  //initialize some stuff
  $scope.details = {};
  $scope.nimsComplianceObjectives = [];



  //////////////////////////
  // CONFIRM SAVE ON EXIT //
  //////////////////////////

  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if(!$scope.exitConfirmed && $scope.unsavedChanges){ // form name needs to be changed to something else
      event.preventDefault();
      modals.yesNoCancel({
        message: "Save changes?",
        yes: function(){
          $scope.save(false);
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        no: function(){
          $scope.exitConfirmed =true;
          $state.go(toState, toParams);
        },
        cancel: function(){}
      })
    }
  });
  // END CONFIRM SAVE ON EXIT

  








  //get resources for page
  var include = [ 
  'Recipient' ,
  'FundingProgram',
  'DWSRFProjectDetail',
  'CWSRFProjectDetail',
  'GreenProjectReserves',
  'CWSRFWaterbodyUses',
  'projectdistricts',
  'obligations',
  'FederalGrantAssignments',
  'CWSRFNeedsCategories',
  // 'DWSRFNIMSCategory'

  // , 'nimsCategories'
  // , 'nimsObjectives'
  // , 'federalgrantassignments'
  // , 'agreement'
  // , 'cwsrfbenefits.cwsrfbenefitcategories'
  
  ];


  var resources = {
    project: $resource(baseUrl + '/api/Project', {}, {
      getByProjectId: { method: 'GET', params: {include: include.join(), projectId: $scope.projectId}, isArray: false}, //takes param projectId
      save: { method: 'PUT' }
    }),
    getNimsComplianceObjectives:$resource(baseUrl + '/API/DWSRFComplianceObjective/GetByProjectId', {}, {
      getByProjectId: { method: 'GET', params: {projectId: $scope.projectId, include: ''}, isArray: true},
    }),
    saveNimsComplianceObjectives:$resource(baseUrl + '/API/DWSRFComplianceObjective/UpdateDWSRFComplianceObjectiveCollection', {},{
      save: {method: 'PUT'}
    }),
    getNimsCategories:$resource(baseUrl + '/API/DWSRFNIMSCategory/GetByProjectId', {}, {
      getByProjectId: { method: 'GET', params: {projectId: $scope.projectId, include: ''}, isArray: true},
    }),
    saveNimsCategories:$resource(baseUrl + '/API/DWSRFNIMSCategory/UpdateDWSRFNIMSCategoryCollection', {},{
      save: {method: 'PUT'}
    }),
    // getNimsCompliancePercentages:$resource(baseUrl + '/API/DWSRFCompliancePercentage/GetByProjectId', {}, {
    //   getByProjectId: { method: 'GET', params: {projectId: $scope.projectId, include: ''}, isArray: true},
    // }),
    // saveCompliancePercentages:$resource(baseUrl + '/API/DWSRFCompliancePercentage/UpdateDWSRFCompliancePercentageCollection', {},{
    //   save: {method: 'PUT'}
    // }),


}; 


loadData();
function loadData(){
  $scope.loading=true;


  var requests =[

    // get project data
    resources.project.getByProjectId(function(results){
      angular.extend($scope.details, results);
      




      //add some records if they are not there
      $scope.details.addresses[0] ? '' : $scope.addRecord('address'); 
      $scope.details.address = $scope.details.addresses[0];

      if($scope.CW && $scope.loan){
        if($scope.details.cwsrfProjectDetail == null){
          $scope.addRecord('cwsrfProjectDetail');
          console.dir(angular.copy($scope.details));
        }
      }
      if($scope.DW && $scope.loan){
        if($scope.details.dwsrfProjectDetail == null){
          $scope.addRecord('dwsrfProjectDetail');
        }
      }
      

      $scope.details.designatedWaterUses = [], $scope.details.otherWaterUses = [];
      angular.forEach($scope.details.cwsrfWaterBodyUses, function(wbUse){
        if (wbUse && wbUse.waterUseTypeId == 181){
          $scope.details.designatedWaterUses.push(wbUse);
        }
        if (wbUse && wbUse.waterUseTypeId == 182){
          $scope.details.otherWaterUses.push(wbUse);
        }
      })

      $scope.processDistricts('load');
      

      // //calculate totals to be displayed
      $scope.updateTotal('greenProjectReserves');
      $scope.updateTotal('federalGrantAssignments');
      if($scope.CW){
        $scope.updateTotal('cwsrfNeedsCategories');
      }



      // CWSRF & DWSRF are main programs — other programs require less than them, not additional. 
      // General information and project location should be enough for other fundng programs.
      $scope.sections = [
      {title:"General Information", anchor: "general" },
      {title:"Project Location/Environmental Review", anchor: "location" },
      {title:"Green Project Reserve", anchor: "green_project_reserve", hideIf:!$scope.loan},
      {title:"Assign to Federal Grant", anchor: "assign_to_federal_grant", hideIf:!$scope.loan},
      {title:"Benefits", anchor: "benefits_dw", hideIf:!$scope.DW || !$scope.loan},
      {title:"Benefits", anchor: "benefits_cw", hideIf:!$scope.CW || !$scope.loan},
      // {title:"Discharge Information", anchor: "discharge_information" , hideIf:!$scope.CW || !$scope.loan},
      // {title:"Project Improvement", anchor: "project_improvement", hideIf:!$scope.CW || !$scope.loan},
      {title:"NIMS Information", anchor: "nims_information", hideIf:!$scope.DW || !$scope.loan}
      ]
      

    }).$promise
];


  // get NIMS stuff for DWSRF
  if($scope.DW){

    //keep collapsible panels open
    $scope.keepNIMSOpenForIDs = [];
    if($scope.details && $scope.details.nims && $scope.details.nims.categories){
      for(var i=0; i<$scope.details.nims.categories.length; i++){
        if($scope.details.nims.categories[i].action!='delete' && $scope.details.nims.categories[i].objectivesOpen){
          $scope.keepNIMSOpenForIDs.push($scope.details.nims.categories[i].dwsrfnimsCategoryId);
        }
      }
    }

    $scope.details.nims = {};
    //get nims Categories
    requests.push(resources.getNimsCategories.getByProjectId(function(results){
      $scope.details.nims.categories = results ;

      for(var i=0; i<$scope.keepNIMSOpenForIDs.length; i++){
        if($scope.keepNIMSOpenForIDs[i] == $scope.details.nims.categories[i].dwsrfnimsCategoryId){
          $scope.details.nims.categories[i].objectivesOpen=true;
        }
      }
    }).$promise)
    
    //get nims ComplianceObjectives
    requests.push(resources.getNimsComplianceObjectives.getByProjectId(function(results){
      $scope.details.nims.complianceObjectives = results ;
    }).$promise);


    
  }



    //enumerate lookups needed
    var lookups = [
    'assigned_staff',
    'compliance_status',
    'system_type',
    'county',
    'legislative_districts',
    'congressional_districts',
    'ownership_type',
    'grant_year',
    'contributes_to_water_quality',
    'allows_system_to',
    'affected_waterbody_is',
    'designated_water_use',
    'other_water_use',
    'protection',
    'restoration',
    'npdes_permit_number',
    'green_project',
    'nims_categories',
    'compliance_objectives',
    'cwsrf_needs_category'
    ];

  //go get 'em

  requests.push(
    lookupAPI.doConcurrentLookups(lookups).then(function(data){
      $scope.lookups = data;
      log.dir($scope.lookups, 'lookups');
    })
    )





  // once all the requests are done
  $q.all(requests).then(function(data){ 
    log.dir($scope.details, 'Project details');
    if($scope.DW){
      $scope.processNIMS('load');
      $scope.updateTotal('nims');
    }
    
    $scope.loading=false;
    $scope.unsavedChanges=false; 
  }); 
}

$scope.loadData = loadData;







   //side menu stuff
   $scope.sideMenuShowing = true;
   $scope.toggleSideMenu = function(){
    $scope.sideMenuShowing = !$scope.sideMenuShowing 
  }


  $scope.scrollToElement = function(anchor){
    var element = angular.element(document.getElementById(anchor));
    $document.scrollToElement(element, 70, 500);
  }




  // save functionality
  $scope.save = function(reload){

    if($scope.validate()){
      $scope.details.cwsrfWaterBodyUses = $scope.details.designatedWaterUses.concat($scope.details.otherWaterUses);
      $scope.processDistricts("save");
      if($scope.DW){
        $scope.processNIMS('save');
      }

      log.group("Saving project details");
      log.dir(angular.copy($scope.details), 'Project details to be saved');



      var saveRequests = [
      resources.project.save($scope.details, function(results){
        console.log("Project details successfully saved!")
      }, function(error){
        modals.alert({head:"Project Details save failed", body:"See console for details"});
        console.error("Project details save failed.");
        console.error(error);
      }).$promise,
      ];


    //save NIMS stuff
    if($scope.DW){
      log.dir(angular.copy($scope.details.nims.categories), 'NIMS Categories to be saved');
      saveRequests.push(
        resources.saveNimsCategories.save($scope.details.nims.categories, function(results){
          console.log("NIMS Category data was successfully saved!")
        }, function(error){
          modals.alert({head:"NIMS Category data save failed", body:"See console for details"});
          console.error("NIMS Category data save failed.");
          console.error(error);
        }).$promise
        )
    }



    $q.all(saveRequests).then(function(data){
      console.log("All save requests complete");
      log.groupEnd("Saving project details");
      $scope.justSaved = true;
      if(reload==null || reload == true){
        loadData();
      }
    })
  }else{
    console.error("Save attempt rejected because of validation failure");
    modals.alert({head:"Invalid Details data", htmlBody: $scope.invalidHTMLMessage});
  }
}




$scope.validate = function(){
  var valid = true;
  $scope.invalidHTMLMessage = "<p class='red bold'>Project Details save failed for these reasons:</p><ul class='invalid-message'>";


  if($scope.details.iup_year){
    $scope.details.iup_year = parseInt($scope.details.iup_year);
  }
  if($scope.CW && $scope.loan){
    if($scope.details.cwsrfProjectDetail.surface_water && !$scope.details.cwsrfProjectDetail.npdes_permit){
      valid=false;
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>If Discharge Affected: Surface Water is checked, user must provide a NPDES Permit number</li>")
    } 
    if($scope.details.cwsrfProjectDetail.groundwater && ($scope.details.cwsrfProjectDetail.npdes_permit || !$scope.details.cwsrfProjectDetail.other_permit_number)){
      valid=false;
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>If Discharge Affected: Groundwater is checked, there should not be a NPDES Permit number, but there should be an \"other\" permit number.</li>")
    } 
  }
  

  if($scope.DW && $scope.loan){
    if($scope.nimsTotals.amount != $scope.project.loanAmount && $scope.nimsTotals.amount !=0){
      valid = false;
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>The total amount assigned to NIMS categories must equal 100% of the loan amount</li>");
    }
    var complianceObjectivesTotalError = false;
    angular.forEach($scope.details.nims.categories, function(cat){
      if(cat.action!='delete' && cat.totals && cat.totals.amount!=cat.amount && cat.totals.amount!=0){
        complianceObjectivesTotalError = true;
      }
    });
    if(complianceObjectivesTotalError){
      valid = false;
      $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("<li>Compliance Objective totals must total to the amount of their associated NIMS category (or 0)</li>");
    }
  }
   
  
  $scope.invalidHTMLMessage = $scope.invalidHTMLMessage.concat("</ul>");
  return valid;
}




  //updating action on edit
  $scope.updateAction = function(actionObject){ //method, property 
    $scope.unsavedChanges=true;
    if(actionObject){
      if(['edit', 'delete', 'add'].indexOf(arguments[1])!=-1){
        if(!(actionObject.action=='add' && arguments[1]=='edit')){
          actionObject.action=arguments[1];
        }
      }else if(actionObject.action!='add'){
        actionObject.action='edit';
      } 
      if(arguments[2]){
        var property = arguments[2];
        switch (property){
          case 'projectImprovement':
          $scope.updateAction($scope.details.projectImprovement);
          break
          default:
          console.log("Custom update action for unknown property");
        }
      }
    }
  }

  //updating totals
  $scope.updateTotal = function(property){
    switch (property){
      case 'greenProjectReserves':
      $scope.details.gprTotals = {
        srf: 0,
        arra: 0
      }
      angular.forEach($scope.details.greenProjectReserves, function(gpr){
        if(gpr.action !='delete'){
          $scope.details.gprTotals.srf += gpr.srf_amount;
          $scope.details.gprTotals.arra += gpr.arra_amount;
        }
        
      })
      break;
      
      case 'federalGrantAssignments':
      var fga = $scope.details.federalGrantAssignments;
      if(fga){
        var ffataReporting = 0, meetGrantRequirements =0;
        for(var i=0; i<fga.length; i++){
          if(fga[i].action!='delete'){
            meetGrantRequirements += fga[i].meetGrantRequirements;
            ffataReporting += fga[i].ffataReporting;
          }
        }
        $scope.fga = {
          assigned:{
            meetGrantRequirements: meetGrantRequirements,
            ffataReporting: ffataReporting
          },
          unassigned:{
            meetGrantRequirements: $scope.project.loanAmount - meetGrantRequirements,
            ffataReporting: $scope.project.loanAmount - ffataReporting
          }
        }
      }
      break;

      case 'cwsrfNeedsCategories':
      var needs = $scope.details.cwsrfNeedsCategories;
      var needsTotals = {percentage:0, fundedAmount:0};
      angular.forEach(needs, function(record, index){
        record.fundedAmount = record.percentage/100.00 * $scope.project.loanAmount;
        needsTotals.percentage += record.percentage;
        needsTotals.fundedAmount += record.fundedAmount;
      })
      needsTotals.valid =  needsTotals.percentage == 100 ? true : false;
      $scope.needsTotals=needsTotals;
      break;


      case 'nims':
      var nims = $scope.details.nims;
      var totals = {amount: 0, percentage: 0};
      var loanAmount = $scope.project.loanAmount; //whatever this value is
      angular.forEach(nims.categories, function(cat){
        if(cat.action!='delete'){
          cat.percentage = cat.amount/loanAmount *100;
          totals.amount += cat.amount;
          totals.percentage += cat.percentage;

          cat.totals = {amount: 0, percentage: 0};
          angular.forEach(cat.objectives, function(obj){
            if(obj.action!='delete'){
              obj.percentage = obj.amount/loanAmount *100;
              cat.totals.amount += obj.amount;
              cat.totals.percentage += obj.percentage;
            }
          })
        }
      })
      $scope.nimsTotals = totals;


    //Objective tallies
    $scope.processNIMS('save');
    var objectives = [];
    angular.forEach(nims.complianceObjectives, function(cObj){
      if(cObj.action !='delete'){
        var found = false;
        angular.forEach(objectives, function(objective){
          if(objective.id == cObj.complianceObjectiveId){
            objective.amount += cObj.amount;
            objective.percentage += cObj.percentage;
            found=true;
          }
        })
        if (!found){
          objectives.push({
            name: null,
            id: cObj.complianceObjectiveId,
            amount: cObj.amount,
            percentage: cObj.percentage
          });
        }
      }
    });


    angular.forEach(objectives, function(objective){
      angular.forEach($scope.lookups['compliance_objectives'], function(component){
        if(component.componentLookUpId == objective.id){
          objective.name = component.componentName;
        }
      })
    })

    $scope.details.nims.objectives = objectives;


    var objectiveTotals = {amount: 0, percentage:0}
    angular.forEach($scope.details.nims.objectives, function(objective){
      objectiveTotals.amount += objective.amount;
      objectiveTotals.percentage += objective.percentage;
    })


    $scope.objectiveTotals = objectiveTotals;



    break;

    default:
    console.error("Could not update total for: " + property);
  }
}




  //adding records to collections
  $scope.addRecord = function(property){
    var array = $scope.details[property];
    $scope.unsavedChanges = true;
    switch (property){
      case 'address':
      $scope.details['addresses'].push({
        action: 'add',
        address1: null,
        address2: null,
        address3: null,
        address4: null,
        addressId: null,
        addressTypeId: null,
        city: null,
        county: null,
        latitude: null,
        longitude: null,
        postalCode: null,
        state: null,
        projectId: parseInt($scope.projectId)
      });
      break;
      case 'federalGrantAssignments':
      $scope.details['federalGrantAssignments'].push({
        action: 'add',
        federalGrantAssignmentId: null,
        ffataDueDate: null,
        ffataReportDate: null,
        ffataReporting: null,
        grantYear: null,
        meetGrantRequirements: null,
        notes: null,
        projectId: parseInt($scope.projectId)
      });
      break;
      case 'designatedWaterUse':
      $scope.details.designatedWaterUses.push({
        action: 'add',
        cwsrfWaterbodyUseId: null,
        projectId: parseInt($scope.projectId),
        protectionId: null,
        restorationId: null,
        waterUseId: null,
        waterUseTypeId: 181
      });
      break;
      case 'otherWaterUse':
      $scope.details.otherWaterUses.push({
        action: 'add',
        cwsrfWaterbodyUseId: null,
        projectId: parseInt($scope.projectId),
        protectionId: null,
        restorationId: null,
        waterUseId: null,
        waterUseTypeId: 182
      });
      break;
      case 'nimsCategory':
      var newCat = {
        action: 'add',
        amount: null,
        dwsrfnimsCategoryId: null,
        list_order: null,
        nimsCategoryId: null,
        objectives: [],
        percentage: 0,
        projectId: $scope.projectId
      };
      $scope.details.nims.categories.push(newCat);
      break;
      case 'nimsObjective':
      if (arguments[1]){
        var cat = arguments[1];

        cat.objectives.push({
          action: 'add',
          amount: null,
          complianceObjectiveId: null,
          dwsrfComplianceObjectiveId: null,
          dwsrfnimsCategoryId: null,
          percentage: 0,
          projectId: $scope.projectId
        });
        console.dir(cat.objectives);
      }
      break;
      case 'cwsrfNeedsCategories':
      $scope.details.cwsrfNeedsCategories.push({
        action: 'add',
        cwsrfNeedsCategoryId: null,
        fundedAmount: null,
        needsCategoryId: null,
        percentage: null,
        percentage_impacting_estuaries: null,
        percentage_solving_nps: null,
        projectId: $scope.projectId
      });
      $scope.updateAction($scope.details.cwsrfBenefit);
      break;
      case 'greenProjectReserves':
      $scope.details.greenProjectReserves.push({
        action: 'add',
        arra_amount: null,
        greenProjectCategory: null,
        greenProjectId: null,
        greenProjectReserveId: null,
        projectId: $scope.projectId,
        srf_amount: null
      });
      $scope.updateAction($scope.details.cwsrfBenefit);
      break;
      case 'cwsrfProjectDetail':
      $scope.details.cwsrfProjectDetail = {
        action: 'add',
        affectedWaterbodyId: null,
        allowsSystemId: null,
        app_number: null,
        contributesWaterQualityId: null,
        cwsrfProjectDetailId: null,
        eliminates_discharge: null,
        existing_tmdl_addressed: null,
        groundwater: null,
        hardship_assistance: null,
        land_application: null,
        needs_survey_number: null,
        no_change_discharge: null,
        no_npdes_permit: null,
        no_valid_waterbody_id: null,
        npdes_permit: null,
        nps_project_number: null,
        other_impacted_receiving_waterbody: null,
        other_impacted_waterbody_id: null,
        other_impacted_waterbody_name: null,
        other_permit_number: null,
        other_permit_type: null,
        other_reuse: null,
        primary_impacted_receiving_waterbody: null,
        primary_impacted_waterbody_id: null,
        primary_impacted_waterbody_name: null,
        projectId: null,
        project_wastewater_volume: null,
        projected_tmdl_addressed: null,
        seasonal_discharge: null,
        surface_water: null,
        system_wastewater_volume: null,
        wastewater_conserved_eliminated: null,
        watershed_addressed: null,
        wetland: null
      }
      break;
      case 'dwsrfProjectDetail':
      $scope.details.dwsrfProjectDetail = {
        action: 'add',
        consolidation_project: null,
        create_new_system: null,
        disadvantage_assistance: null,
        dwsrfProjectDetailId: null,
        number_systems_eliminated: null,
        ownershipType: null,
        ownershipTypeId: null,
        projectId: $scope.projectId,
        public_health_impact:  null,
        pws_number:  null
      }
      break;
      default:
      console.error("Could not add new record for " + property);

    }
  }

  //deleting records from collection
  $scope.deleteRecord = function(array, index){
    $scope.unsavedChanges = true;
    if (array[index].hasOwnProperty('action')){
      if(array[index].action!='add'){
        $scope.updateAction(array[index], 'delete');
      }
      else{
        array.splice(index, 1);
      }
    }else{
      array.splice(index, 1);
    }
    if(arguments[2]){
      var property = arguments[2];
      switch (property){
        case 'nimsCategory':
        angular.forEach(array[index].objectives, function(objective){
          $scope.updateAction(objective, 'delete');
        });
        angular.forEach(array[index].dWSRFComplianceObjectives, function(objective){
          $scope.updateAction(objective, 'delete');
        })
        $scope.updateTotal('nims');
        break;
        /* old Nims
        case 'nimsCategories':
        var compObjs = $scope.nimsComplianceObjectives;
        for(var i=0; i<array.length; i++){
          if(array[i].action=='delete'){
            for(var j=0; j<compObjs.length; j++){
              if(compObjs[j].nimsCategoryId == array[i].nimsCategoryId){
                $scope.updateAction(compObjs[j],'delete');
              }
            }
          }
        }
        break;
        case 'nimsObjectives':
        var compObjs = $scope.nimsComplianceObjectives;
        for(var i=0; i<array.length; i++){
          if(array[i].action=='delete'){
            for(var j=0; j<compObjs.length; j++){
              if(compObjs[j].nimsObjectiveId == array[i].nimsObjectiveId){
                $scope.updateAction(compObjs[j],'delete');
              }
            }
          }
        }
        break;
        */
        case 'projectImprovement':
        $scope.updateAction($scope.details.projectImprovement);
        break;
        default:
        console.error("Custom delete for unknown property failed");
      }
    }
  }

  //helper functions


  //formatting name displayed in dropdowns
  $scope.optionString = function(property, option){
    switch (property){
      case 'assignedStaff':
      return option.lastName + ', ' + option.firstName;
      break;
      case 'npdes':
      return option.cwsrfnpdesId + " | " + option.facilityName;
      break;
      case 'county': //workaround for some low-level string comparison/rendering bug
      return option.countyName + " ";
      break;
      case 'waterbody':
      return option.waterBodyId + " | " + option.reach;
      break;
      default:
      console.error("Error in creating option string for: " + property);
    }
  }


  $scope.processDistricts = function(arg){

    var congressionalId = 151, legislativeId = 152;
    if(arg=="load"){
      $scope.details.legislativeDistrictIds = [], $scope.details.congressionalDistrictIds = [];
      angular.forEach($scope.details.projectDistricts, function(district){
        if(district.districtTypeId == congressionalId){
          $scope.details.congressionalDistrictIds.push(district.districtId);
        }else if (district.districtTypeId == legislativeId){
          $scope.details.legislativeDistrictIds.push(district.districtId);
        }
      });
    }else if (arg == "change"){
      $scope.districtChange = true;
    }else if(arg == "save"){
      if($scope.districtChange){
        angular.forEach($scope.details.projectDistricts, function(projectDistrict){
          $scope.updateAction(projectDistrict, 'delete');
        })
        angular.forEach($scope.details.legislativeDistrictIds, function(districtId){
          $scope.details.projectDistricts.push({
            action: 'add',
            districtId: districtId,
            districtTypeId: legislativeId,
            projectDistrictId: null,
            projectId: $scope.project.projectId
          })
        });
        angular.forEach($scope.details.congressionalDistrictIds, function(districtId){
          $scope.details.projectDistricts.push({
            action: 'add',
            districtId: districtId,
            districtTypeId: congressionalId,
            projectDistrictId: null,
            projectId: $scope.project.projectId
          })
        });

      }
    }
  }

  $scope.selectWaterbodyId = function(waterbodyId, property){
   modals.selectWaterbodyId({
    ok: function(waterbody){
      console.dir(waterbody);
      if(property == 'primary'){
       $scope.details.cwsrfProjectDetail.primary_impacted_waterbody_id = waterbody.waterbodyId;
       $scope.details.cwsrfProjectDetail.primary_impacted_waterbody_name = waterbody.waterbodyName;
       $scope.updateAction($scope.details.cwsrfProjectDetail);

     }
     else if (property == 'other'){
      $scope.details.cwsrfProjectDetail.other_impacted_waterbody_id = waterbody.waterbodyId;
      $scope.details.cwsrfProjectDetail.other_impacted_waterbody_name = waterbody.waterbodyName;
      $scope.updateAction($scope.details.cwsrfProjectDetail);
    }

  },
  waterbodyId: waterbodyId
});
 }

 $scope.updateWaterBodyName = function(property){
  switch (property){
    case 'primary':
    var waterbodyId = $scope.details.discharge.primary_impacted_waterbody_id;
    angular.forEach($scope.lookups['waterbody_id'], function(waterbody){
      if(waterbodyId==waterbody.waterBodyId){
        $scope.details.discharge.primary_impacted_waterbody_name = waterbody.reach;
      }
    })
    break;
    case 'other':
    var waterbodyId = $scope.details.discharge.other_impacted_waterbody_id;
    angular.forEach($scope.lookups['waterbody_id'], function(waterbody){
      if(waterbodyId==waterbody.waterBodyId){
        $scope.details.discharge.other_impacted_waterbody_name = waterbody.reach;
      }
    })
    break;
    default:
    console.error("Could not update waterbody name for " + property);
  }
}


$scope.processNIMS = function(arg){
  var nims = $scope.details.nims;
  switch (arg){
    case 'load':
    angular.forEach(nims.categories, function(cat){
      cat.objectives = [];
      angular.forEach(nims.complianceObjectives, function(cObj){
        if(cObj.dwsrfnimsCategoryId == cat.dwsrfnimsCategoryId){
          cat.objectives.push(cObj);
        }
      })
    })
    log.dir(nims.categories, "NIMS");
    break;
    case 'save':
    var complianceObjectives = [];
    angular.forEach(nims.categories, function(cat){
      cat.dWSRFComplianceObjectives = cat.objectives;
      angular.forEach(cat.objectives, function(obj){
        complianceObjectives.push(obj)
      })
    })
    nims.complianceObjectives = complianceObjectives;
    break;
    default:
    console.error("Could not process NIMS for '" + arg + "'");
  }
}


$scope.toggleNIMSObjectives = function(row){
  row.objectivesOpen = !row.objectivesOpen;
}




$scope.money = function(decimalAmount, truncate){
  var money =  dataFormats['money'](decimalAmount, truncate);
  return money;
}

$scope.percent = function(decimalAmount){
  var percent =  dataFormats['percent'](decimalAmount);
  return percent;
}

}])






;