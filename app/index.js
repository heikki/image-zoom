window.App = angular.module('image-zoom', []);

App.controller('MainCtrl', function() {

	var images = [
		'test.jpg',
		'test-left.jpg',
		'test-right.jpg'
	];

	this.image = images.shift();

	this.changeImage = function() {
		var next = images.shift();
		images.push(this.image);
		this.image = next;
	};

});
