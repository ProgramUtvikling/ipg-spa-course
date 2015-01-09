define(["knockout", "MyKoUtils", "Data/Movies", "komapping"], function (ko, myKoUtils, movieSvc, komapping) {
	"use strict";

	var componentName = "MovieDetail";
	ko.components.register(componentName, {
		viewModel: function (params) {

			var isInEditMode = ko.observable(false);
			var storedMovie = new movieSvc.Movie();
			var editMovie = new movieSvc.Movie();

			movieSvc.getMovie(params.id).then(function (data) {
				myKoUtils.mergeInto(data, storedMovie);
				myKoUtils.mergeInto(storedMovie, editMovie);
			});


			var model = {
				movie: storedMovie,
				editMovie: editMovie,
				isInEditMode: isInEditMode,
				edit: function () {
					myKoUtils.mergeInto(storedMovie, editMovie);
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