App.directive('imageZoom', function($document, $window) {
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="image-zoom"><img src="{{ image }}"></div>',
		scope: {
			image: '@'
		},
		link: function(scope, element) {

			var pan = Victor(0, 0);

			var zoom = 0;

			var content = element.children('img').css('width', '100%').on('load', function() {
				content.css('width', 'auto');
				zoom = 0;
				update();
			});

			function update() {

				// Set container height to match content aspect ratio
				element.css('height', ((content[0].offsetHeight / content[0].offsetWidth) * element[0].offsetWidth) + 'px');

				var elementSize = Victor(element[0].offsetWidth, element[0].offsetHeight);
				var contentSize = Victor(content[0].offsetWidth, content[0].offsetHeight);
				var minZoom = Math.max(elementSize.x / contentSize.x, elementSize.y / contentSize.y);

				// Limit zoom
				zoom = Math.min(Math.max(zoom, minZoom), 1);

				// Convert to element coordinates
				contentSize.multiply(Victor(zoom, zoom));

				// Center content
				var translate = elementSize.clone().subtract(contentSize).multiply(Victor(0.5, 0.5));

				// Apply panning
				var availablePan = contentSize.clone().subtract(elementSize);
				availablePan.x = Math.max(availablePan.x, 0);
				availablePan.y = Math.max(availablePan.y, 0);
				translate.subtract(availablePan.multiply(pan));

				// Convert back to content coordinates
				translate.divide(Victor(zoom, zoom));

				content.css({
					transform: 'scale(' + zoom + ') translate3d(' + translate.x + 'px, ' + translate.y + 'px, 0)',
					'transform-origin': '0% 0%'
				});
			}

			element.on('click', function(event) {
				if (document.webkitFullscreenElement === null) {
					event.currentTarget.webkitRequestFullscreen();
				} else if (document.webkitFullscreenElement === event.currentTarget) {
					document.webkitExitFullscreen();
				}
			});

			element.on('mousemove', function(event) {
				pan.x = (event.layerX / event.currentTarget.offsetWidth) - 0.5;
				pan.y = (event.layerY / event.currentTarget.offsetHeight) - 0.5;
				update();
			});

			element.on('mousewheel', function(event) {
				event.preventDefault();
				event.stopPropagation();
				zoom -= event.wheelDelta / 4000;
				update();
			});

			$document.on('webkitfullscreenchange', function() {
				zoom = 0;
				update();
			});

			angular.element($window).on('resize', update);

			element.on('$destroy', function() {
				element.off();
				content.off();
				$document.off('webkitfullscreenchange');
				angular.element($window).off('resize', update);
			});

		}
	};
});
