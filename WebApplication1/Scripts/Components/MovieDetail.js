define(["knockout", "MyKoUtils", "Data/Movies", "komapping"], function (ko, myKoUtils, movieSvc) {
	"use strict";

	var componentName = "MovieDetail";
	ko.components.register(componentName, {
		viewModel: function (params) {

			var isInEditMode = ko.observable(false);
			var storedMovie = movieSvc.getMovie(params.id);
			var editMovie = myKoUtils.copy(storedMovie);

			var model = {
				movie: storedMovie,
				//editMovie: editMovie,
				edit: function () {
					editMovie = myKoUtils.copy(storedMovie);
					isInEditMode(true);
				},
				save: function () {
					movieSvc.updateMovie(editMovie);
					isInEditMode(false);
				},
				cancel: function () {
					myKoUtils.mergeInto(storedMovie, editMovie);
					isInEditMode(false);
				}
			};
			return model;
		},
		template: { require: "text!Templates/MovieDetail.html" }
	});

	return {
		urlTemplate: "movie/:id",
		name: componentName
	};
});