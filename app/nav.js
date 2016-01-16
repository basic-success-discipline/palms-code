'use strict'

angular.module('nav', [])
.factory('navPath', function () {

    var nav = {
        paths: {
            'Projects': {
                title: 'Projects',
                state: 'projects',
                receivesStates: ['home'],
                nav: {
                    paths: {
                        Details: {
                            title: 'Details',
                            state: 'project.details'
                        },
                        'Project Cost': {
                            title: 'Project Cost',
                            state: 'project.cost',
                            nav: {
                                paths: {
                                    'Document History': {
                                        title: 'Document History',
                                        state: 'project.cost.agreement_history'
                                    },
                                    'Funding Authorization': {
                                        title: 'Funding Authorization',
                                        state: 'project.cost.funding_auth'
                                    },
                                    'Payment Requests': {
                                        title: 'Payment Requests',
                                        state: 'project.cost.payment_requests',
                                        receivesStates: ['project.cost.payment_requests.payment_request'],
                                    },
                                    'Funding Status': {
                                        title: 'Funding Status',
                                        state: 'project.cost.funding_status'
                                    }
                                    // 'Funding Sources':{
                                    //   title: 'Funding Sources',
                                    //   state: 'project.cost.funding_sources'
                                    // }
                                },
                                current: 'Funding Status'
                            }
                        },
                        // 'Obligations/Disbursements':{
                        //   title: 'Obligations/Disbursements',
                        //   state: 'project.obligations_and_disbursements'
                        // },
                        'Loan Amortization': {
                            title: 'Loan Amortization',
                            state: 'project.amortization',
                            nav: {
                                paths: {
                                    'Administrative Fees': {
                                        title: 'Administrative Fees',
                                        state: 'project.amortization.administrative_fees'
                                    },
                                    'Loan Terms': {
                                        title: 'Loan Terms',
                                        state: 'project.amortization.loan_terms'
                                    },
                                    'Loan Schedule': {
                                        title: 'Loan Schedule',
                                        state: 'project.amortization.loan_schedule'
                                    }
                                },
                                current: 'Loan Terms'
                            },

                        },
                        // Repayments:{
                        //   title: 'Repayments',
                        //   state: 'project.repayments'
                        // }
                    },
                    current: ''
                }

            },
            'Parties': {
                title: 'Parties',
                state: 'parties',
                nav: {
                    paths: {
                        'Details': {
                            title: 'Details',
                            state: 'party.details'
                        }
                    },
                    current: 'Details'
                }
            },
            // Reports: {
            //   title: 'Reports',
            //   state: 'reports',
            //   nav: {}
            // }
            'Contacts': {
                title: 'Contacts',
                state: 'contacts'
            },
            // current: ''
        }
    }

    return {
        nav: nav,
        updateCurrentDeep: function (key, value, nav) {
            for (var k in nav.paths) {       //for each object in nav.paths


                if (nav.paths[k][key] == value) {       //if that object has the key/value pair we're looking for
                    nav.current = nav.paths[k]['title'];    //update nav.current with that key
                    return true;
                }

                //if we are specifically testing for state, check for any additional states the path may receive
                if (key == "state" && nav.paths[k]['receivesStates'] != null) {
                    var rs = nav.paths[k]['receivesStates'];
                    for (var index in rs) {
                        if (rs[index] == value) {
                            nav.current = nav.paths[k]['title'];
                            return true;
                        }
                    }
                }
            }
            var currentDeepUpdated = false;
            for (var k in nav.paths) {
                if (nav.paths[k].nav != null) {
                    var childUpdated = this.updateCurrentDeep(key, value, nav.paths[k].nav);
                    if (childUpdated) {
                        nav.current = nav.paths[k]['title'];
                    }
                    currentDeepUpdated = currentDeepUpdated || childUpdated;
                }
            }
            return currentDeepUpdated;
        }
}
})


.directive('mynavbar', function () {
    return {
        restrict: 'AC',
        templateUrl: 'app/nav.html',
        controller: 'navCtrl'
    }
})

.controller('navCtrl', ['$scope', '$rootScope', 'navPath', '$state', 'log', function ($scope, $rootScope, navPath, $state, log) {


    $scope.show = $rootScope.showNav;

    $scope.nav = navPath.nav;
    $scope.paths = $scope.nav.paths
    $scope.current = $scope.nav.current;


    $rootScope.$on('$stateChangeSuccess',
    function (event, toState, toParams, fromState, fromParams) {
        $scope.showProject = toParams.projectId != undefined;
        $scope.showParty = toParams.partyId != undefined;
        navPath.updateCurrentDeep('state', toState.name, $scope.nav);


    });





}])

