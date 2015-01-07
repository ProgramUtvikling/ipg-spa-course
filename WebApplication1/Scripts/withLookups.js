define(["knockout"], function (ko) {
	return function () {
		ko.bindingHandlers.withLookups = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				var lookups = {};
				var arrayOfLookupNames = valueAccessor();
				require(arrayOfLookupNames, function () {
					for (var i = 0; i < arguments.length; i++) {
						var lookupModule = arguments[i];
						console.log(lookupModule.lookupFunctionName);
						lookups[lookupModule.lookupFunctionName] = lookupModule.lookupFunction;
					}
				});

				var innerBindingContext = bindingContext.extend(lookups);
				ko.applyBindingsToDescendants(innerBindingContext, element);

				//ko.virtualElements.allowedBindings.withLookups = true;

				return { controlsDescendantBindings: true };
			}
		};
	}
});