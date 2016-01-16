app.config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
    function ($urlRouterProvider, $stateProvider, $locationProvider) {
        //$locationProvider.html5Mode(true); //This requires the server supports URL rewriting
        $locationProvider.hashPrefix("!");
        // $locationProvider.html5Mode(true);
        
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'projects/projects.html',
                controller: 'projectsCtrl'
            })

            // PROJECTS
            .state('projects', {
               url: '/projects',
               templateUrl: 'projects/projects.html',
               controller: 'projectsCtrl'
            })
            .state('project', {
               url: '/project/:projectId',
               templateUrl: 'projects/project.html',
               controller: 'projectCtrl'
            })
            .state('project.details', {
                url: '/details',
                templateUrl: 'projects/details/details.html',
                controller: 'project.detailsCtrl'
            })
            .state('project.cost', {
                url: '/cost',
                templateUrl: 'projects/cost/cost.html',
                controller: 'project.costCtrl'
            })
            .state('project.cost.agreement_history', {
                url: '/document_history',
                templateUrl: 'projects/cost/agreement_history/agreement_history.html',
                controller: 'project.cost.agreement_historyCtrl'
            })
            //create_loan_documents opens as its own screen, but conceptually it is part of the agreement history process
            .state('create_loan_documents', {
                url: '/create_loan_documents?projectId&actionId',
                templateUrl: 'projects/cost/agreement_history/create_loan_documents.html',
                controller: 'create_loan_documentsCtrl'
            })
            .state('project.cost.funding_auth', {
                url: '/funding_auth',
                templateUrl: 'projects/cost/funding_auth/funding_auth.html',
                controller: 'project.cost.funding_authCtrl'
            })
            .state('project.cost.payment_requests', {
                url: '/payment_requests',
                templateUrl: 'projects/cost/payment_requests/payment_requests.html',
                controller: 'project.cost.payment_requestsCtrl'
            })
            // .state('project.cost.payment_requests.payment_request', {
            //     url: '/:paymentRequestNumber',
            //     templateUrl: 'projects/cost/payment_requests/payment_request.html',
            //     controller: 'project.cost.payment_requestCtrl',
            //     params: {paymentRequestId:null, paymentRequestNumber:null}
            // })
            .state('project.cost.funding_status', {
                url: '/funding_status',
                templateUrl: 'projects/cost/funding_status/funding_status.html',
                controller: 'project.cost.funding_statusCtrl'
            })
            .state('project.cost.funding_sources', {
                url: '/funding_sources',
                templateUrl: 'projects/cost/funding_sources/funding_sources.html',
                controller: 'project.cost.funding_sourcesCtrl'
            })

            .state('project.amortization', {
                url: '/amortization',
                templateUrl: 'projects/amortization/amortization.html',
                controller: 'project.amortizationCtrl'
            })

            .state('project.amortization.administrative_fees', {
                url: '/administrative_fees',
                templateUrl: 'projects/amortization/administrative_fees/administrative_fees.html',
                controller: 'project.amortization.administrative_feesCtrl'
            })

            .state('project.amortization.loan_terms', {
                url: '/loan_terms',
                templateUrl: 'projects/amortization/loan_terms/loan_terms.html',
                controller: 'project.amortization.loan_termsCtrl'
            })

            .state('project.amortization.loan_schedule', {
                url: '/loan_schedule',
                templateUrl: 'projects/amortization/loan_schedule/loan_schedule.html',
                controller: 'project.amortization.loan_scheduleCtrl'
            })



            

            // PARTIES
            .state('parties', {
                url: '/parties',
                templateUrl: 'parties/parties.html',
                controller: 'partiesCtrl'
            })
            .state('party', {
               url: '/party/:partyId',
               templateUrl: 'parties/party.html',
               controller: 'partyCtrl'
            })
            .state('party.details', {
                url: '/details',
                templateUrl: 'parties/details/details.html',
                controller: 'party.detailsCtrl'
            })


            // CONTACTS
            .state('contacts', {
                url: '/contacts',
                templateUrl: 'contacts/contacts.html',
                controller: 'contactsCtrl'
            })

            // REPORTS
            .state('reports', {
                url: '/reports',
                templateUrl: 'reports/reports.html',
                controller: 'reportsCtrl'
            })

            // SECURTY
            .state('changePassword', {
                url: '/ChangePassword/:userId/:token',
                templateUrl: 'Security/ChangePassword.html',
                controller: 'changePasswordCtrl'
            })
            .state('newUserRegistration', {
                url: '/register/:userId/:token',
                templateUrl: 'Users/RegisterUser.html',
                controller: 'registerUserCtrl'
            })
            .state('passwordReset', {
                url: '/password-reset',
                templateUrl: 'Security/PasswordReset.html',
                controller: 'passwordResetCtrl'
            })
            .state('passwordResetResult', {
                url: '/password-reset-result/:result',
                templateUrl: 'Security/PasswordResetResult.html',
                controller: 'passwordResetResultCtrl'
            })
            .state('roles', {
                url: '/roles',
                templateUrl: 'Security/roleList.html',
                controller: 'roleListCtrl'
            })
            .state('roleDetail', {
                url: '/roles/:roleId',
                templateUrl: 'Security/roleDetail.html',
                controller: 'roleDetailCtrl'
            })
            .state('users', {
                url: '/users',
                templateUrl: 'Users/UserList.html',
                controller: 'userListCtrl'
            })
            .state('userDetail', {
                url: '/users/:userId',
                templateUrl: 'Users/UserDetail.html',
                controller: 'userDetailCtrl'
            })
            .state('userProfile', {
                url: '/user-profile',
                templateUrl: 'Users/UserProfile.html',
                controller: 'userProfileCtrl',
            })
            .state("login", {
                url: "/login",
                templateUrl: "Security/login.html",
                controller: "LoginCtrl",
                onEnter: function ($timeout) {
                   $timeout(function () {
                       var nameElem = angular.element('#userName');
                       var pwElem = angular.element('#password');
                       if (nameElem.val()) {
                           nameElem.change();
                       }
                       if (pwElem.val()) {
                           pwElem.change();
                       }
                    }, 1000);
                }
            })



            .state('404', {
                url: '/404',
                templateUrl: 'app/404.html'
            })
            ;

            $urlRouterProvider.otherwise('/404');
        }]);