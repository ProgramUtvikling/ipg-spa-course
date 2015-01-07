define(["knockout"], function (ko) {
	ko.bindingHandlers.withLookups = {
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

			var arrayOfLookupNames = valueAccessor();

			// syntax: data-bind="lookup: {genre: 2}" -> conflict with text: ???

			return { controlsDescendantBindings: true };
		}
	};
});