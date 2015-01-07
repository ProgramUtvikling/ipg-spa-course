define(["knockout"], function (ko) {
	"use strict";

	var componentName = "Sample";
	ko.components.register(componentName, {
		viewModel: function (params) {
			return { id: params.id};
		},
		template: { require: "text!Templates/Sample.html" }
	});

	return {
		urlTemplate: "sample/:id",
		name: componentName
	};
});