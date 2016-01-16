(function () {
    "use strict";

    app.controller("AlertDialogController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.close = function () {
            $modalInstance.close("acknowledged");
        };
    }]);

    app.controller("ChoiceDialogController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.close = function (response) {
            $modalInstance.close(response);
        };
    }]);

    app.controller("MultipleChoiceDialogController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.close = function (response) {
            $modalInstance.close(response);
        };
    }]);

    app.controller("ConfirmDialogController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.close = function () {
            $modalInstance.close("confirmed");
        };

        $scope.dismiss = function () {
            $modalInstance.dismiss("canceled");
        };
    }]);

    app.controller("PromptDialogController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.close = function (response) {
            $modalInstance.close(response);
        };

        $scope.dismiss = function () {
            $modalInstance.dismiss("canceled");
        };
    }]);

    app.controller("CommentsController", ["$scope", "$modalInstance", function ($scope, $modalInstance) {
        $scope.output = {};
        $scope.add = function () {
            $modalInstance.close($scope.output.comment);
        }
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        }
    }]);

    app.service("dialogService", ["$modal", "$rootScope", "toaster", function ($modal, $rootScope, toaster) {
        this.alert = function () {
            var message, title, closeText, parameters, template, list;

            if (typeof arguments[0] == "object") {
                parameters = arguments[0];
                message = arguments[1];
                title = arguments[2];
                closeText = arguments[3];
                template = arguments[4];
                list = arguments[5];
            }
            else {
                message = arguments[0];
                title = arguments[1];
                closeText = arguments[2];
                template = arguments[3];
                list = arguments[4];
            }

            var scope = $rootScope.$new();
            scope.title =title || "PALMS", parameters;
            scope.message = message, parameters;
            scope.closeText = closeText || "OK", parameters;
            scope.results = list;

            var promise = $modal.open({
                templateUrl: template == undefined ? "Dialogs/Alert.html" : template,
                backdrop: true,
                keyboard: false,
                scope: scope,
                controller: "AlertDialogController"
            }).result;

            return promise;
        };

        this.confirm = function () {
            var message, title, closeText, dismissText, parameters;

            if (typeof arguments[0] == "object") {
                parameters = arguments[0];
                message = arguments[1];
                title = arguments[2];
                closeText = arguments[3];
                dismissText = arguments[4];
            }
            else {
                message = arguments[0];
                title = arguments[1];
                closeText = arguments[2];
                dismissText = arguments[3];
            }

            var scope = $rootScope.$new();
            scope.title = title || "Confirm", parameters;
            scope.message = message, parameters;
            scope.closeText = closeText || "OK", parameters;
            scope.dismissText = dismissText || "Cancel", parameters;

            var promise = $modal.open({
                templateUrl: "Dialogs/Confirm.html",
                backdrop: true,
                keyboard: false,
                scope: scope,
                controller: "ConfirmDialogController"
            }).result;

            return promise;
        };

        this.prompt = function (options) {
            var scope = $rootScope.$new();
            scope.title = options.title || "Question", options.parameters;
            scope.message = options.message || "Please provide answer.", options.parameters;
            scope.placeholderText = options.placeholderText ? options.placeholderText: null;
            scope.closeText = options.closeText || "OK", options.parameters;
            scope.dismissText = options.dismissText || "Cancel", options.parameters;
            scope.response = options.defaultResponse;

            var promise = $modal.open({
                templateUrl: "Dialogs/Prompt.html",
                backdrop: true,
                keyboard: false,
                scope: scope,
                controller: "PromptDialogController"
            }).result;

            return promise;
        };

        this.choice = function () {
            var parameters, scope = $rootScope.$new(), argIndex = 1;

            if (arguments.length > 1 && typeof arguments[1] == "object") {
                parameters = arguments[argIndex++];
            }
            scope.message = arguments[argIndex++] || "Please select your choice.", parameters;
            scope.title = arguments[argIndex++] || "PALMS", parameters;

            scope.choices = [];
            for (var i in arguments[0]) {
                scope.choices.push({ response: i, text: arguments[0][i] });
            }

            var promise = $modal.open({
                controller: "ChoiceDialogController",
                backdrop: "static",
                keyboard: false,
                templateUrl: "Dialogs/Choice.html",
                scope: scope
            }).result;

            return promise;
        };

        this.multipleChoice = function () {
            var message, title, closeText, dismissText, propertyToDisplay;

            propertyToDisplay = arguments[0].propertyToDisplay;
            message = arguments[1];
            title = arguments[2];
            closeText = arguments[3];
            dismissText = arguments[4];

            var scope = $rootScope.$new();
            scope.title = title || "Confirm";
            scope.message = message;
            scope.closeText = closeText || "Copy";
            scope.dismissText = dismissText || "Cancel";

            scope.response = new Array();

            scope.select = function (response, $event) {
                if ($event.target.checked) {
                    scope.response.push(response);
                } else {
                    scope.response.splice(scope.response.indexOf(response), 1);
                }
            }


            scope.choices = [];
            for (var i in arguments[0].choices) {
                if (arguments[0].choices[i][propertyToDisplay] != undefined && arguments[0].choices[i][propertyToDisplay].length > 1)
                    scope.choices.push({ response: arguments[0].choices[i], text: arguments[0].choices[i][propertyToDisplay] });
            }

            var promise = $modal.open({
                controller: "MultipleChoiceDialogController",
                backdrop: "static",
                keyboard: false,
                templateUrl: "Dialogs/MultipleChoice.html",
                scope: scope
            }).result;

            return promise;
        };

        this.popup = function (msgType, title, msg) {
            toaster.pop(msgType, title, msg);
        };

        this.comments = function (comments, title) {
            var scope = $rootScope.$new();
            scope.comments = comments;
            scope.title = title;
            scope.title = title;
            var promise = $modal.open({
                templateUrl: 'Dialogs/Comments.tpl.html',
                controller: 'CommentsController',
                size: 'lg',
                scope: scope
            }).result;

            return promise;
        }

    }]);
})();