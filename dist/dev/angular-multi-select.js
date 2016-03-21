'use strict';

var angular_multi_select = angular.module('angular-multi-select', ['angular-multi-select-utils', 'angular-multi-select-engine', 'angular-multi-select-constants', 'angular-multi-select-styles-helper', 'angular-multi-select-data-converter']);

angular_multi_select.directive('angularMultiSelect', ['$http', '$compile', '$timeout', '$templateCache', 'angularMultiSelectUtils', 'angularMultiSelectEngine', 'angularMultiSelectConstants', 'angularMultiSelectStylesHelper', 'angularMultiSelectDataConverter', function ($http, $compile, $timeout, $templateCache, angularMultiSelectUtils, angularMultiSelectEngine, angularMultiSelectConstants, angularMultiSelectStylesHelper, angularMultiSelectDataConverter) {
	'use strict';

	return {
		restrict: 'AE',

		scope: {
			inputModel: '=',
			outputModel: '='
		},

		link: function link($scope, element, attrs) {
			var template = $templateCache.get('angular-multi-select.tpl');
			var content = $compile(template)($scope);
			element.append(content);

			var self = {};
			var amsu = new angularMultiSelectUtils();
			$scope.amsu = amsu;

			/*
    █████  ████████ ████████ ██████  ██ ██████  ██    ██ ████████ ███████ ███████
   ██   ██    ██       ██    ██   ██ ██ ██   ██ ██    ██    ██    ██      ██
   ███████    ██       ██    ██████  ██ ██████  ██    ██    ██    █████   ███████
   ██   ██    ██       ██    ██   ██ ██ ██   ██ ██    ██    ██    ██           ██
   ██   ██    ██       ██    ██   ██ ██ ██████   ██████     ██    ███████ ███████
   */
			/*
   * Find out what are the properties names of the important bits
   * of the input data.
   */
			$scope.ops = {
				DEBUG: attrs.debug === "true" ? true : false,
				NAME: attrs.name,
				MAX_CHECKED_LEAFS: parseInt(attrs.maxCheckedLeafs),

				ID_PROPERTY: attrs.idProperty,
				OPEN_PROPERTY: attrs.openProperty,
				CHECKED_PROPERTY: attrs.checkedProperty,
				CHILDREN_PROPERTY: attrs.childrenProperty
			};
			$scope.ops = amsu.sanitize_ops($scope.ops);

			/*
    * Set the directive's name as attribute. If it exists, it will be overriten with
    * the same value, else, it will be set with the autogenerated value. This is required
    * for the visibility code.
    */
			element.attr("name", $scope.ops.NAME);

			/*
    * Find out if the input data should be threated in some special way.
    */
			self.do_not_check_data = attrs.doNotCheckData === "true" ? true : false;
			self.do_not_convert_data = attrs.doNotConvertData === "true" ? true : false;

			/*
    * Find out if the output data should be converted in some special way.
    */
			self.output_keys = amsu.array_from_attr(attrs.outputKeys);
			self.output_type = attrs.outputType === undefined ? 'objects' : attrs.outputType;
			self.output_filter = attrs.outputFilter === undefined ? angularMultiSelectConstants.FIND_LEAFS : attrs.outputFilter;

			/*
    * Find out which field to use for the 'search' functionality.
    */
			$scope.search_field = attrs.searchField === undefined ? null : attrs.searchField;

			/*
    * Find out if something should be preselected.
    */
			self.preselect = amsu.array_from_attr(attrs.preselect);

			/*
    * Find out if some of the helpers should be hidden.
    */
			$scope.hide_helpers = amsu.array_from_attr(attrs.hideHelpers) || [];

			/*
    █████  ███    ███ ███████      ██████  ██████       ██ ███████  ██████ ████████ ███████
   ██   ██ ████  ████ ██          ██    ██ ██   ██      ██ ██      ██         ██    ██
   ███████ ██ ████ ██ ███████     ██    ██ ██████       ██ █████   ██         ██    ███████
   ██   ██ ██  ██  ██      ██     ██    ██ ██   ██ ██   ██ ██      ██         ██         ██
   ██   ██ ██      ██ ███████      ██████  ██████   █████  ███████  ██████    ██    ███████
   */
			var amse = new angularMultiSelectEngine($scope.ops);
			var amssh = new angularMultiSelectStylesHelper($scope.ops, attrs);
			var amsdc = new angularMultiSelectDataConverter($scope.ops);
			$scope.amse = amse;
			$scope.amssh = amssh;

			/*
   ██    ██ ██ ███████ ██ ██████  ██ ██      ██ ████████ ██    ██
   ██    ██ ██ ██      ██ ██   ██ ██ ██      ██    ██     ██  ██
   ██    ██ ██ ███████ ██ ██████  ██ ██      ██    ██      ████
    ██  ██  ██      ██ ██ ██   ██ ██ ██      ██    ██       ██
     ████   ██ ███████ ██ ██████  ██ ███████ ██    ██       ██
   */
			$scope.open = false;
			$scope.onclick_listener = function (event) {
				if (!event.target) {
					return;
				}

				if (!amsu.element_belongs_to_directive(event.target, $scope.ops.NAME)) {
					$scope.open = false;
					$scope.$apply();
				}
			};
			document.addEventListener('click', $scope.onclick_listener);

			/*
    * Show the directive to the left/right and at the top/bottom
    * of the button itself, depending on the available space.
    */
			$scope.$watch('open', function (_new, _old) {
				if (_new !== true) {
					return;
				}

				$timeout(function () {
					amssh.transform_position(element);
				});
			});

			/*
   ████████ ██     ██ ███████  █████  ██   ██ ███████
      ██    ██     ██ ██      ██   ██ ██  ██  ██
      ██    ██  █  ██ █████   ███████ █████   ███████
      ██    ██ ███ ██ ██      ██   ██ ██  ██       ██
      ██     ███ ███  ███████ ██   ██ ██   ██ ███████
   */

			/*
    * Prevent the scroll event bubbling to the parents on the DOM.
    */
			amsu.prevent_scroll_bubbling(element[0].getElementsByClassName('ams-items')[0]);

			/*
    * Make keyboard navigation possible.
    */
			$scope.focused_index = -1;
			$scope.onkeypress_listener = function (event) {
				if ($scope.open === false) {
					return;
				}

				amsu.process_kb_input(event, $scope, element);

				/*
     * This is required to avoid weird gaps appearing between the items
     * container and the button if the container is positione on top of
     * the button and a node is closed.
     */
				$timeout(function () {
					amssh.transform_position(element);
				});
			};
			document.addEventListener('keydown', $scope.onkeypress_listener);

			/*
   ██   ██ ███████ ██      ██████  ███████ ██████  ███████
   ██   ██ ██      ██      ██   ██ ██      ██   ██ ██
   ███████ █████   ██      ██████  █████   ██████  ███████
   ██   ██ ██      ██      ██      ██      ██   ██      ██
   ██   ██ ███████ ███████ ██      ███████ ██   ██ ███████
   */
			/*
    * The 'reset_model' will be filled in with the first available
    * data from the input model and will be used when the 'reset'
    * function is triggered.
    */
			$scope.reset_model = null;
			$scope.reset = function () {
				amse.insert($scope.reset_model);

				if (self.preselect !== undefined) {
					amse.check_node_by(self.preselect);
				}

				$scope.items = amse.get_visible_tree();
			};

			/*
   ███████ ███████  █████  ██████   ██████ ██   ██
   ██      ██      ██   ██ ██   ██ ██      ██   ██
   ███████ █████   ███████ ██████  ██      ███████
        ██ ██      ██   ██ ██   ██ ██      ██   ██
   ███████ ███████ ██   ██ ██   ██  ██████ ██   ██
   */
			$scope.search = "";
			self.search_promise = null;
			$scope.search_spinner_visible = false;
			$scope.$watch('search', function (_new, _old) {
				if (_new === _old && _new === "") {
					return;
				}

				if ($scope.search_field === null) {
					return;
				}

				/*
     * This means that there was a search, but it was deleted
     * and now the normal tree should be repainted.
     */
				if (_new === "") {
					if (self.search_promise !== null) {
						$timeout.cancel(self.search_promise);
					}
					$scope.items = amse.get_visible_tree();
					$scope.search_spinner_visible = false;
					return;
				}

				/*
     * If the code execution gets here, it means that there is
     * a search that should be performed
     */
				if (self.search_promise !== null) {
					$timeout.cancel(self.search_promise);
				}

				$scope.search_spinner_visible = true;
				self.search_promise = $timeout(function (query) {
					//TODO: this needs a lot of improving. Maybe use lunar.js?
					var filter = [];
					filter.push({
						field: $scope.search_field,
						query: query
					});

					$scope.items = amse.get_filtered_tree(filter);
					$scope.search_spinner_visible = false;
				}, 1500, true, _new);
			});

			/*
    ██████  ███    ██     ██████   █████  ████████  █████       ██████ ██   ██  █████  ███    ██  ██████  ███████
   ██    ██ ████   ██     ██   ██ ██   ██    ██    ██   ██     ██      ██   ██ ██   ██ ████   ██ ██       ██
   ██    ██ ██ ██  ██     ██   ██ ███████    ██    ███████     ██      ███████ ███████ ██ ██  ██ ██   ███ █████
   ██    ██ ██  ██ ██     ██   ██ ██   ██    ██    ██   ██     ██      ██   ██ ██   ██ ██  ██ ██ ██    ██ ██
    ██████  ██   ████     ██████  ██   ██    ██    ██   ██      ██████ ██   ██ ██   ██ ██   ████  ██████  ███████
   */
			amse.on_data_change_fn = function () {
				/*
     * Will be triggered every time the internal model data is changed.
     * That could happen on check/uncheck, for example.
     */

				$scope.stats = amse.get_stats();
				/*
     * Get the visible tree only once. Consecutive calls on un/check
     * will automatically propagate to the rendered tree.
     */
				$scope.items = amse.get_visible_tree();

				if ($scope.outputModel !== undefined) {
					var checked_tree = amse.get_checked_tree(self.output_filter);

					/*
      * Remove internal (undeeded) data.
      */
					var res = $scope.ops.DEBUG ? checked_tree : amsdc.to_external(checked_tree);

					/*
      * Convert the data to the desired output.
      */
					switch (self.output_type) {
						case angularMultiSelectConstants.OUTPUT_DATA_TYPE_OBJECTS:
							res = amsdc.to_array_of_objects(res, self.output_keys);
							break;
						case angularMultiSelectConstants.OUTPUT_DATA_TYPE_ARRAYS:
							res = amsdc.to_array_of_arrays(res, self.output_keys);
							break;
						case angularMultiSelectConstants.OUTPUT_DATA_TYPE_OBJECT:
							res = amsdc.to_object(res, self.output_keys);
							break;
						case angularMultiSelectConstants.OUTPUT_DATA_TYPE_ARRAY:
							res = amsdc.to_array(res, self.output_keys);
							break;
						case angularMultiSelectConstants.OUTPUT_DATA_TYPE_VALUE:
							res = amsdc.to_value(res, self.output_keys);
							break;
					}

					$scope.outputModel = res;
				}
			};

			/*
    ██████  ███    ██     ██    ██ ██ ███████ ██    ██  █████  ██           ██████ ██   ██  █████  ███    ██  ██████  ███████
   ██    ██ ████   ██     ██    ██ ██ ██      ██    ██ ██   ██ ██          ██      ██   ██ ██   ██ ████   ██ ██       ██
   ██    ██ ██ ██  ██     ██    ██ ██ ███████ ██    ██ ███████ ██          ██      ███████ ███████ ██ ██  ██ ██   ███ █████
   ██    ██ ██  ██ ██      ██  ██  ██      ██ ██    ██ ██   ██ ██          ██      ██   ██ ██   ██ ██  ██ ██ ██    ██ ██
    ██████  ██   ████       ████   ██ ███████  ██████  ██   ██ ███████      ██████ ██   ██ ██   ██ ██   ████  ██████  ███████
   */
			amse.on_visual_change_fn = function () {
				/*
     * Will be triggered when a change that requires a visual change happende.
     * This is normaly on open/close actions.
     */
				$scope.items = amse.get_visible_tree();
			};

			/*
   ███    ███  █████  ██ ███    ██
   ████  ████ ██   ██ ██ ████   ██
   ██ ████ ██ ███████ ██ ██ ██  ██
   ██  ██  ██ ██   ██ ██ ██  ██ ██
   ██      ██ ██   ██ ██ ██   ████
   */
			self.init = function (data) {
				if (!Array.isArray(data)) {
					return;
				}

				var checked_data = self.do_not_check_data ? data : amsdc.check_prerequisites(data);
				var internal_data = self.do_not_convert_data ? checked_data : amsdc.to_internal(checked_data);

				if ($scope.reset_model === null) {
					$scope.reset_model = internal_data;
				}

				amse.insert(internal_data);

				if (self.preselect !== undefined) {
					amse.check_node_by(self.preselect);
				}
			};

			$scope.$watch('inputModel', function (_new, _old) {
				/*
    * The entry point of the directive. This monitors the input data and
    * decides when to populate the internal data model and how to do it.
    */
				if (typeof _new === "string") {
					try {
						self.init(JSON.parse(_new));
					} catch (e) {
						$http.get(_new).then(function (response) {
							self.init(response.data);
						});
					}
				} else {
					self.init(_new);
				}
			});

			$scope.$on('$destroy', function () {
				amse.remove_collection($scope.ops.NAME);
				document.removeEventListener('click', $scope.onclick_listener);
				document.removeEventListener('keydown', $scope.onkeypress_listener);
			});
		}
	};
}]);
