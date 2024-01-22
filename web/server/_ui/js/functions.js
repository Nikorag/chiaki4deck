/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
function registerConsole(host, $modal, socket){
	let modalInstance = $modal.open({
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
		socket.emit("register", form);
	});   
}

function wakeup(host, $modal, socket) {
	let modalInstance = $modal.open({
		animcation: true,
		templateUrl: "/standbyExecuteDialog",
		controller: "StandbyCtrl",
		resolve: {
			host: function() {
				return host;
			}
		}
	});
	
	modalInstance.result.then(function () {
		console.log("Waking "+host.hostId);
		socket.emit("wake", host);
	});
}

function startStream(host){
	let form = document.getElementById("stream_form");
	let input = document.querySelector("#stream_form input");
	input.value = host.hostId;
	form.submit();
}