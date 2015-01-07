define(["knockout", "koprojections", "Data/Movies"], function (ko, _, movieSvc) {
	"use strict";

	var componentName = "MovieIndex";
	ko.components.register(componentName, {
		viewModel: function () {
			var model = movieSvc.getMovies();

			return model;
		},
		template: { require: "text!Templates/MovieIndex.html" }
	});

	return {
		urlTemplate: "index",
		name: componentName
	};
});