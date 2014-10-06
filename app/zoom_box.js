App.directive('zoomBox', function($document, $window) {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		template:
			'<div class="zoom-box">' +
			'    <div class="zoom-box-content" ng-transclude></div>' +
			'</div>',
		link: function(scope, element) {

			var content = element.children('div');

			var scale = 0;

			var mouse = Victor(0, 0);

			var isFullscreen = false;

			function update() {

				// Set container height to match content aspect ratio
				element.css({ height: ((content[0].offsetHeight / content[0].offsetWidth) * element[0].offsetWidth) + 'px' });

				var elementSize = Victor(element[0].offsetWidth, element[0].offsetHeight);
				var contentSize = Victor(content[0].offsetWidth, content[0].offsetHeight);
				var minScale = Math.max(elementSize.x / contentSize.x, elementSize.y / contentSize.y);

				// Limit scale
				scale = Math.min(Math.max(scale, minScale), 1);

				// Force redraw
				scale += (Math.random() - 0.5) / 10000000;

				// Convert to element coordinates
				contentSize.multiply(Victor(scale, scale));

				// Center content
				var translate = elementSize.clone()
					.subtract(contentSize)
					.multiply(Victor(0.5, 0.5));

				// Apply panning
				var availablePan = contentSize.clone().subtract(elementSize);
				var panAmount = mouse.clone().divide(elementSize).subtract(Victor(0.5, 0.5));
				availablePan.x = Math.max(availablePan.x, 0);
				availablePan.y = Math.max(availablePan.y, 0);
				translate.subtract(availablePan.multiply(panAmount));

				// Convert back to content coordinates
				translate.divide(Victor(scale, scale));

				content.css({
					transform:
						'scale(' + scale + ') ' +
						'translate(' + translate.x + 'px, ' + translate.y + 'px)',
					'transform-origin': '0% 0%'
				});
			}

			$window.requestAnimationFrame(update);

			element.on('click', function(event) {
				if (!isFullscreen) {
					event.currentTarget.webkitRequestFullscreen();
				} else if (document.webkitFullscreenElement === event.currentTarget) {
					document.webkitExitFullscreen();
				}
			});

			element.on('mousemove', function(event) {
				mouse.x = event.layerX;
				mouse.y = event.layerY;
				update();
			});

			element.on('mousewheel', function(event) {
				event.preventDefault();
				event.stopPropagation();
				scale -= event.wheelDelta / 4000;
				update();
			});

			$document.on('webkitfullscreenchange', function() {
				isFullscreen = document.webkitFullscreenElement === element[0];
				scale = isFullscreen ? scale : 0;
				update();
			});

			angular.element($window).on('resize', update);

			element.on('$destroy', function() {
				element.off();
				$document.off('webkitfullscreenchange');
				angular.element($window).off('resize', update);
			});

		}
	};
});
