'use strict';

/* Controllers */

function AppCtrl($scope, socket, $modal) {
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
        
        modalInstance.result.then(function (selectedItem) {
            
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
        });
    };
}

function RegisterCtrl($scope, $modalInstance, host) {
    $scope.host = host;
    $scope.addressType = (host.hostType == 1 ? "ps5" : "ps4_gt_8");
    
    $scope.ok = function () {
        $modalInstance.close($scope.selected.item);
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

app.controller("AppCtrl", ['$scope', 'socket', '$modal', AppCtrl]);
app.controller("RegisterCtrl", ['$scope', '$modalInstance', 'host', RegisterCtrl]);