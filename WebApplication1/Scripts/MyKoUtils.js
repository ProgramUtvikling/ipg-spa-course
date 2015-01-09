define(["knockout", "komapping"], function(ko, komapping) {
	"use strict";

	var func = function (from, to) {
		//var unwrapped = komapping.toJS(from);
		//return komapping.fromJS(unwrapped, {}, to);

		to = to || {};
		for (var propertyname in from) {
			if (from.hasOwnProperty(propertyname) && propertyname.indexOf('__') !== 0) {

				// Get value either from normal property, or from observable
				var value = ko.isObservable(from[propertyname]) ?
					from[propertyname]() : from[propertyname];

				// Set value in one of these ways: exisiting observable,
				//   existing property or a new observable
				if (to[propertyname] === undefined) {
					to[propertyname] = ko.observable(value);
				} else if (ko.isObservable(to[propertyname])) {
					to[propertyname](value);
				} else {
					to[propertyname] = value;
				}
			}
		}
		return to;
	};

	return {
		copy: func,
		mergeInto: func,
}
});