window.App = angular.module('image-zoom', []);

App.controller('MainCtrl', function($scope, $document, $http) {

	var self = this;

	var modes = ['3d-tv', 'cross-eye'];

	var images = [];

	self.mode = modes.shift();

	$http.get('/images.json').then(function(result) {
		images = result.data;
		self.image = images.shift();
	});

	function onKeydown(event) {
		$scope.$apply(function() {
			if (event.keyCode === 77) {
				var mode = modes.shift();
				modes.push(self.mode);
				self.mode = mode;
			} else if (event.keyCode === 37 || event.keyCode === 38) {
				var prev = images.shift();
				images.push(self.image);
				self.image = prev;
				event.preventDefault();
			} else if (event.keyCode === 39 || event.keyCode === 40) {
				var next = images.pop();
				images.unshift(self.image);
				self.image = next;
				event.preventDefault();
			}
		});
	}

	$document.on('keydown', onKeydown);

});
