"use strict";

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
// eslint-disable-next-line no-undef
app.factory("socket", function ($rootScope) {
	// eslint-disable-next-line no-undef
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});