/// <reference path="../bower_components/requirejs/require.js" />
require.config({
	baseUrl: "/scripts",
	paths: {
		domready: "../bower_components/requirejs-domready/domready",
		text: "../bower_components/requirejs-text/text",
		knockout: "../bower_components/knockout/dist/knockout",
		komapping: "../bower_components/knockout-mapping/build/output/knockout.mapping-latest",
		koprojections: "../bower_components/knockout-projections/dist/knockout-projections",
		jquery: "../bower_components/jquery/dist/jquery",
		grapnel: "../bower_components/grapnel/dist/grapnel.min",
		lodash: "../bower_components/lodash/dist/lodash"
	},
	shim: {
		komapping: ["knockout"],
		koprojections: ["knockout"],
		jquery: { exports: "$" },
	}
});



require(["grapnel", "knockout", "withLookups", "domready!"], function (grapnel, ko, setupWithLookups) {
	"use strict";

	setupWithLookups();

	ko.components.register("NotFound", { template: "Page Not Found!" });

	var currentComponentNameAndParams = ko.observable(null);

	var vm = {
		component: currentComponentNameAndParams
	};
	ko.applyBindings(vm);


	var router = new grapnel.Router();
	router.get("", function () {
		router.anchor.set("/index");
	});


	require([
		"Components/MovieIndex",
		"Components/MovieDetail"
	], function () {
		router.get("*", function () {
			currentComponentNameAndParams({ name: "NotFound", params: {} });
		});

		// This function is there to capture each closure, and not just the last one... (Could be written as an IFEE)
		var fn = (function (component) {
			router.get('/' + component.urlTemplate, function (req) {
				currentComponentNameAndParams({ name: component.name, params: req.params });
			});
		});

		// arguments here is a list of components to load (See the function we're in, inside the require statement)
		for (var i = 0; i < arguments.length; i++) {

			fn(arguments[i]);
		}
	});
});
