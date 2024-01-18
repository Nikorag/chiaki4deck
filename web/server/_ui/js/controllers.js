'use strict';

/* Controllers */

function AppCtrl($scope, socket, $modal, $http) {
    socket.on('discovered_hosts', function (data) {
        $scope.hosts = data.map((host) => {
            return {
                ...host,
                status : mapStatus(host.status)
            }
        });
        console.log($scope.hosts);
    });

    $scope.consoleImage = function(host){
        if (host.hostType == 0) {
            return "images/console.svg"
        } else {
            return "images/console2.svg"
        }
    };
    
    $scope.registerConsole = function(host) {
        console.log("Clicked");
        var modalInstance = $modal.open({
            animcation: true,
            templateUrl: "/register",
            controller: "RegisterCtrl",
            resolve: {
                host: function() {
                    return host;
                }
            }
        });
        
        modalInstance.result.then(function (form) {
                $http.post('/register', form);
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
        });
    };
}

function RegisterCtrl($scope, $modalInstance, host) {
    $scope.host = host;
    $scope.addressType = (host.hostType == 1 ? "ps5" : "ps4_gt_8");
    
    $scope.inputAddress = host.address;

    $scope.ok = function () {
        let form = {
            hostId : $scope.host.hostId,
            inputAddress : $scope.inputAddress,
            addressType : mapAddressType($scope.addressType),
            psnOnlineId : $scope.psnOnlineId ? $scope.psnOnlineId : "",
            psnAccountId : $scope.psnAccountId,
            pin : $scope.pin.toString()
        }
        $modalInstance.close(form);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function mapStatus(status){
    if (status === 620) { return "Standby"; }
    if (status === 200) { return "Ready"; }
    return "UNKNOWN"
}

function mapAddressType(type) {
    if (type == "ps5") return 1000100;
    if (type == "ps4_lt_7") return 800;
    if (type == "ps4_gt_7_lt_8") return 900;
    if (type == "ps4_gt_8") return 1000;
    return 1000100;
}

app.controller("AppCtrl", ['$scope', 'socket', '$modal', '$http', AppCtrl]);
app.controller("RegisterCtrl", ['$scope', '$modalInstance', 'host', RegisterCtrl]);