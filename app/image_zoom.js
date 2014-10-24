App.directive('imageZoom', function($document, $window) {

	var templates = {
		mono:
			'<div class="image-zoom mono">' +
			'    <image-zoom-image image="{{ image }}" pan="pan" zoom="zoom"></image-zoom-image>' +
			'</div>',
		stereo:
			'<div class="image-zoom stereo">' +
			'    <image-zoom-image image="{{ left }}" pan="pan" zoom="zoom"></image-zoom-image>' +
			'    <image-zoom-image image="{{ right }}" pan="pan" zoom="zoom"></image-zoom-image>' +
			'</div>'
	};

	return {
		restrict: 'E',
		replace: true,
		template: function(element, attrs) {
			if (attrs.image) {
				return templates.mono;
			} else if (attrs.left && attrs.right) {
				attrs.mode = attrs.mode || 'cross-eye';
				return templates.stereo;
			}
		},
		scope: {
			image: '@',
			left: '@',
			right: '@'
		},
		link: function(scope, element) {

			scope.pan = scope.pan || Victor(0, 0);

			scope.zoom = scope.zoom || 0;

			element.on('click', function(event) {
				scope.$apply(function() {
					if (document.webkitFullscreenElement === null) {
						event.currentTarget.webkitRequestFullscreen();
					} else if (document.webkitFullscreenElement === event.currentTarget) {
						document.webkitExitFullscreen();
					}
				});
			});

			element.on('mousemove mousewheel', function(event) {
				var el = event.currentTarget;
				scope.$apply(function() {
					scope.pan.x = ((event.pageX - el.offsetLeft) / el.clientWidth) - 0.5;
					scope.pan.y = ((event.pageY - el.offsetTop) / el.clientHeight) - 0.5;
					if (event.type === 'mousewheel') {
						event.preventDefault();
						event.stopPropagation();
						scope.zoom += event.wheelDelta / 4000;
					}
				});
			});

			function reset() {
				scope.$apply(function() {
					scope.zoom = 0;
				});
			}

			$document.on('webkitfullscreenchange', reset);

			angular.element($window).on('resize', reset);

			element.on('$destroy', function() {
				element.off();
				$document.off('webkitfullscreenchange', reset);
				angular.element($window).off('resize', reset);
			});

		}
	};
});

App.directive('imageZoomImage', function() {
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="image-zoom-image"><img ng-src="{{ image }}"></div>',
		scope: {
			image: '@',
			pan: '=',
			zoom: '='
		},
		link: function(scope, element) {

			scope.pan = scope.pan || Victor(0, 0);

			scope.zoom = scope.zoom || 0;

			var content = element.children('img').css('width', '100%').on('load', function() {
				content.css('width', 'auto');
				scope.$apply(function() {
					scope.zoom = 0;
				});
			});

			function watchFn() {
				return [scope.pan.x, scope.pan.y, scope.zoom, element[0].clientWidth];
			}

			scope.$watch(watchFn, function() {

				// Set container height to match content aspect ratio
				element.css('height', ((content[0].clientHeight / content[0].clientWidth) * element[0].clientWidth) + 'px');

				var elementSize = Victor(element[0].clientWidth, element[0].clientHeight);
				var contentSize = Victor(content[0].clientWidth, content[0].clientHeight);
				var minZoom = Math.max(elementSize.x / contentSize.x, elementSize.y / contentSize.y);

				// Limit zoom
				scope.zoom = Math.min(Math.max(scope.zoom, minZoom), 1);

				// Convert to element coordinates
				contentSize.multiply(Victor(scope.zoom, scope.zoom));

				// Center content
				var translate = elementSize.clone().subtract(contentSize).multiply(Victor(0.5, 0.5));

				// Apply panning
				var availablePan = contentSize.clone().subtract(elementSize);
				availablePan.x = Math.max(availablePan.x, 0);
				availablePan.y = Math.max(availablePan.y, 0);
				translate.subtract(availablePan.multiply(scope.pan));

				// Convert back to content coordinates
				translate.divide(Victor(scope.zoom, scope.zoom)).unfloat();

				content.css({
					transform: 'scale(' + scope.zoom + ') translate3d(' + translate.x + 'px, ' + translate.y + 'px, 0)',
					'transform-origin': '0% 0%'
				});

			}, true);

		}
	};
});
