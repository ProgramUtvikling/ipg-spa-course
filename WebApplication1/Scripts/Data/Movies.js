define(["jquery", "knockout", "komapping", "MyKoUtils"], function ($, ko, komapping, myKoUtils) {
	"use strict";

	var Movie = function () {
		this.id = ko.observable();
		this.title = ko.observable();
		this.productionYear = ko.observable();
		this.runningLength = ko.observable();
		this.vote = ko.observable();
	};

	var isLoaded = false;
	var movies = ko.observableArray();

	var ensureLoaded = function () {
		var deferredObject = $.Deferred();
		if (isLoaded) {
			deferredObject.resolve();
		} else {
			$.ajax({
				url: '/Api/Movie',
				method: 'GET'
			}).then(function (data) {
				data.forEach(function (item) {
					movies.push(komapping.fromJS(item));
				});
				deferredObject.resolve();
			});
			isLoaded = true;
		}

		return deferredObject.promise();
	};


	var getMovies = function () {
		ensureLoaded();
		return movies;
	};

	var getMovie = function (id) {
		var deferred = $.Deferred();

		$.ajax({
			url: '/Api/Movie/' + id,
			method: 'GET'
		}).then(function (data) {
			var movie = komapping.fromJS(data);
			deferred.resolve(movie);
		});

		return deferred.promise();
	};

	var updateMovie = function (movie) {
		$.ajax({
			url: '/Api/Movie/' + movie.id(),
			method: "PUT",
			data: komapping.toJSON(movie),
			dataType: 'json'
		}).then(function (data1, data2) {
			alert("data1: " + JSON.stringify(data1) + "\ndata2: " + JSON.stringify(data2));
		}, function (err) {
			alert("something went wrong: " + JSON.stringify(err));
		});
	};

	return {
		getMovies: getMovies,
		getMovie: getMovie,
		updateMovie: updateMovie,
		Movie: Movie
	};
});